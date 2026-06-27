import type { Child, ReadingPlan } from "@prisma/client";
import { deriveStorySizing, type StorySizing } from "@/src/lib/onboarding/story-sizing";
import { prisma } from "@/src/lib/prisma";
import type { ReadingPlanConfiguration } from "@/src/lib/onboarding/plan-constraints";
import { getReadingPlanConfigurationFromChild } from "@/src/lib/onboarding/plan-constraints";

export type PlanningContext = {
  readingPlan: ReadingPlan;
  child: Child;
  readingPlanConfiguration: ReadingPlanConfiguration;
  sizing: StorySizing;
};

export async function collectPlanningContext(
  readingPlanId: string,
): Promise<PlanningContext | null> {
  const readingPlan = await prisma.readingPlan.findUnique({
    where: { id: readingPlanId },
    include: { child: true },
  });

  if (!readingPlan) {
    return null;
  }

  const readingPlanConfiguration = getReadingPlanConfigurationFromChild(
    readingPlan.child,
  );
  const sizing = deriveStorySizing(
    readingPlan.sessionDurationMins,
    readingPlan.readingLevel,
    readingPlanConfiguration,
  );

  return {
    readingPlan,
    child: readingPlan.child,
    readingPlanConfiguration,
    sizing,
  };
}

export function buildPlanningInputSnapshot(context: PlanningContext) {
  const { readingPlan, child, readingPlanConfiguration, sizing } = context;

  return {
    child: {
      id: child.id,
      name: child.name,
      age: child.age,
      gender: child.gender,
      readingLevel: child.readingLevel,
      primaryLanguage: child.primaryLanguage,
      interests: child.interests,
      assignedChallenges: child.assignedChallenges,
      favoriteCharacterType: child.favoriteCharacterType,
      storyTone: child.storyTone,
      storiesPerWeek: child.storiesPerWeek,
      sessionDurationMins: child.sessionDurationMins,
    },
    plan: {
      id: readingPlan.id,
      planNumber: readingPlan.planNumber,
      sourceInterests: readingPlan.sourceInterests,
      readingLevel: readingPlan.readingLevel,
      primaryLanguage: readingPlan.primaryLanguage,
      assignedChallenges: readingPlan.assignedChallenges,
      favoriteCharacterType: readingPlan.favoriteCharacterType,
      storyTone: readingPlan.storyTone,
      storiesPerWeek: readingPlan.storiesPerWeek,
      sessionDurationMins: readingPlan.sessionDurationMins,
      readingPlanConfiguration,
      worldsPerRoadmapMin: readingPlan.worldsPerRoadmapMin,
      worldsPerRoadmapMax: readingPlan.worldsPerRoadmapMax,
      storiesPerWorld: readingPlan.storiesPerWorld,
      sizing,
    },
  };
}
