"use server";
import type { OnboardingFormData } from "@/src/lib/onboarding/schemas";
import { auth, unstable_update } from "@/src/auth";
import { parseOnboardingForm, validateOnboardingFormWithPlan } from "@/src/lib/onboarding/schemas";
import type { OnboardingFormState } from "@/src/lib/onboarding/schemas";
import type {
  OnboardingActionResult,
  OnboardingCompleteData,
  OnboardingErrorCode,
} from "@/src/lib/onboarding/types";
import { prisma } from "@/src/lib/prisma";
import {
  getPlanConstraints,
  getReadingPlanConfiguration,
  type ReadingPlanConfiguration,
} from "@/src/lib/onboarding/plan-constraints";

function fail<T = void>(
  code: OnboardingErrorCode,
  message: string,
  field?: string,
): OnboardingActionResult<T> {
  return { success: false, error: { code, message, field } };
}

export async function completeOnboardingAction(
  input: OnboardingFormState,
): Promise<OnboardingActionResult<OnboardingCompleteData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "You must be logged in to complete onboarding");
  }

  // Get user's subscription plan
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return fail("UNAUTHORIZED", "User not found");
  }

  // Get plan constraints and validate
  const constraints = getPlanConstraints(user.subscriptionPlan);
  const planValidation = validateOnboardingFormWithPlan(input, constraints);
  if (!planValidation.valid) {
    return fail("VALIDATION_ERROR", planValidation.message, planValidation.field);
  }

  const readingPlanConfiguration = getReadingPlanConfiguration(
    user.subscriptionPlan,
  );

  const parsed = parseOnboardingForm(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      "VALIDATION_ERROR",
      issue.message,
      issue.path.join(".") || "form",
    );
  }

  const data = parsed.data;

  const existingChild = await prisma.child.findFirst({
    where: {
      parentId: session.user.id,
      onboardingCompletedAt: { not: null },
    },
  });

  if (existingChild) {
    return fail("ALREADY_ONBOARDED", "Onboarding has already been completed");
  }

  try {
    const result = await createChildProfile(
      session.user.id,
      data,
      readingPlanConfiguration,
      constraints.maxChildProfiles,
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: { newUser: false },
    });

    await unstable_update({
      user: {
        newUser: false,
        childId: result.childId,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[completeOnboardingAction]", error);
    return fail("ONBOARDING_FAILED", "An error occurred during onboarding");
  }
}




export type CreatedChildProfile = {
  childId: string;
};

export async function createChildProfile(
  parentId: string,
  data: OnboardingFormData,
  readingPlanConfiguration: ReadingPlanConfiguration,
  maxChildProfiles: number,
): Promise<CreatedChildProfile> {
  const childCount = await prisma.child.count({
    where: { parentId },
  });

  if (childCount >= maxChildProfiles) {
    throw new Error("CHILD_PROFILE_LIMIT_REACHED");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const child = await tx.child.create({
        data: {
          parentId,
          name: data.name,
          birthDate: data.birthDate,
          gender: data.gender,
          primaryLanguage: data.primaryLanguage,
          readingLevel: data.readingLevel,
          initialReadingLevel: data.readingLevel,
          assignedChallenges: data.assignedChallenges,
          interests: data.interests,
          favoriteCharacterType: data.favoriteCharacterType,
          storyTone: data.storyTone,
          storiesPerWeek: data.storiesPerWeek,
          sessionDurationMins: data.sessionDurationMins,
          activateNotifications: data.activateNotifications,
          parentSubscriptionPlan:
            readingPlanConfiguration.parentSubscriptionPlan,
          maxThemesAllowed: readingPlanConfiguration.maxThemesAllowed,
          maxStoriesPerWeekAllowed:
            readingPlanConfiguration.maxStoriesPerWeekAllowed,
          maxChallengeTypes: readingPlanConfiguration.maxChallengeTypes,
          maxWorldsPerRoadmapAllowed:
            readingPlanConfiguration.maxWorldsPerRoadmapAllowed,
          maxEpisodesPerWorldAllowed:
            readingPlanConfiguration.maxEpisodesPerWorldAllowed,
          maxChaptersPerStoryAllowed:
            readingPlanConfiguration.maxChaptersPerStoryAllowed,
          onboardingCompletedAt: new Date(),
        },
      });

      await tx.childDailyActivity.create({
        data: { childId: child.id },
      });




      return { child };
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );

  return {
    childId: result.child.id,
  };
}
