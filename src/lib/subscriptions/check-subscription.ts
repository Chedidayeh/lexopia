import { prisma } from "@/src/lib/prisma";
import { SubscriptionPlan } from "@/src/types/types";
import { getReadingPlanConfiguration, getAvailableChallengesByPlan } from "@/src/lib/onboarding/plan-constraints";

export async function checkSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionRenewsAt: true,
    },
  });
  
  if (!user) return { active: false, plan: SubscriptionPlan.FREE };
  
  // Check if subscription is expired
  if (user.subscriptionRenewsAt && new Date() > user.subscriptionRenewsAt) {
    // Downgrade to FREE
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStatus: "expired",
      },
    });
    await updateChildrenConstraints(userId, SubscriptionPlan.FREE);
    return { active: false, plan: SubscriptionPlan.FREE };
  }
  
  return {
    active: user.subscriptionStatus === "active",
    plan: user.subscriptionPlan,
  };
}

async function updateChildrenConstraints(userId: string, plan: SubscriptionPlan) {
  const newConfig = getReadingPlanConfiguration(plan);
  const newChallenges = getAvailableChallengesByPlan(plan);

  await prisma.child.updateMany({
    where: { parentId: userId },
    data: {
      parentSubscriptionPlan: newConfig.parentSubscriptionPlan,
      maxThemesAllowed: newConfig.maxThemesAllowed,
      maxStoriesPerWeekAllowed: newConfig.maxStoriesPerWeekAllowed,
      storiesPerWeek: newConfig.maxStoriesPerWeekAllowed,
      maxChallengeTypes: newConfig.maxChallengeTypes,
      assignedChallenges: newChallenges,
      maxWorldsPerRoadmapAllowed: newConfig.maxWorldsPerRoadmapAllowed,
      maxEpisodesPerWorldAllowed: newConfig.maxEpisodesPerWorldAllowed,
      maxChaptersPerStoryAllowed: newConfig.maxChaptersPerStoryAllowed,
    },
  });
}
