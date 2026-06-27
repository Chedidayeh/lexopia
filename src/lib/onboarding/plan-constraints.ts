import type { Child } from "@prisma/client";
import { SubscriptionPlan } from "@/src/types/types";

export type PlanConstraints = {
  maxChildProfiles: number;
  maxThemes: number;
  maxStoriesPerWeek: number;
  challengeTypesCount: "basic" | "core" | "all";
};

export type ReadingPlanConfiguration = {
  parentSubscriptionPlan: SubscriptionPlan;
  maxChildProfiles: number;
  maxThemesAllowed: number;
  maxStoriesPerWeekAllowed: number;
  maxChallengeTypes: number;
  maxWorldsPerRoadmapAllowed: number;
  maxEpisodesPerWorldAllowed: number;
  maxChaptersPerStoryAllowed: number;
};

export type ReadingPlanStructure = {
  worldsPerRoadmapMin: number;
  worldsPerRoadmapMax: number;
  storiesPerWorld: number;
};

const PLAN_CONSTRAINTS: Record<SubscriptionPlan, PlanConstraints> = {
  [SubscriptionPlan.FREE]: {
    maxChildProfiles: 1,
    maxThemes: 1,
    maxStoriesPerWeek: 1,
    challengeTypesCount: "basic", // 3 challenge types
  },
  [SubscriptionPlan.PRO]: {
    maxChildProfiles: 3,
    maxThemes: 3,
    maxStoriesPerWeek: 3,
    challengeTypesCount: "core", // 6 challenge types
  },
  [SubscriptionPlan.PRO_PLUS]: {
    maxChildProfiles: 5,
    maxThemes: 5,
    maxStoriesPerWeek: 7,
    challengeTypesCount: "all", // 9 challenge types
  },
};

export function getPlanConstraints(plan: SubscriptionPlan): PlanConstraints {
  return PLAN_CONSTRAINTS[plan];
}

export function getReadingPlanConfiguration(
  plan: SubscriptionPlan,
): ReadingPlanConfiguration {
  const constraints = getPlanConstraints(plan);

  const challengeTypesByPlan: Record<PlanConstraints["challengeTypesCount"], number> = {
    basic: 3,
    core: 6,
    all: 9,
  };

  const configurationByPlan: Record<SubscriptionPlan, Omit<ReadingPlanConfiguration, "parentSubscriptionPlan">> = {
    [SubscriptionPlan.FREE]: {
      maxChildProfiles: constraints.maxChildProfiles,
      maxThemesAllowed: constraints.maxThemes,
      maxStoriesPerWeekAllowed: constraints.maxStoriesPerWeek,
      maxChallengeTypes: challengeTypesByPlan[constraints.challengeTypesCount],
      maxWorldsPerRoadmapAllowed: 1,
      maxEpisodesPerWorldAllowed: 4,
      maxChaptersPerStoryAllowed: 6,
    },
    [SubscriptionPlan.PRO]: {
      maxChildProfiles: constraints.maxChildProfiles,
      maxThemesAllowed: constraints.maxThemes,
      maxStoriesPerWeekAllowed: constraints.maxStoriesPerWeek,
      maxChallengeTypes: challengeTypesByPlan[constraints.challengeTypesCount],
      maxWorldsPerRoadmapAllowed: 3,
      maxEpisodesPerWorldAllowed: 6,
      maxChaptersPerStoryAllowed: 8,
    },
    [SubscriptionPlan.PRO_PLUS]: {
      maxChildProfiles: constraints.maxChildProfiles,
      maxThemesAllowed: constraints.maxThemes,
      maxStoriesPerWeekAllowed: constraints.maxStoriesPerWeek,
      maxChallengeTypes: challengeTypesByPlan[constraints.challengeTypesCount],
      maxWorldsPerRoadmapAllowed: 3,
      maxEpisodesPerWorldAllowed: 8,
      maxChaptersPerStoryAllowed: 10,
    },
  };

  return {
    parentSubscriptionPlan: plan,
    ...configurationByPlan[plan],
  };
}

export function getReadingPlanConfigurationFromChild(
  child: Pick<
    Child,
    | "parentSubscriptionPlan"
    | "maxThemesAllowed"
    | "maxStoriesPerWeekAllowed"
    | "maxChallengeTypes"
    | "maxWorldsPerRoadmapAllowed"
    | "maxEpisodesPerWorldAllowed"
    | "maxChaptersPerStoryAllowed"
  >,
): ReadingPlanConfiguration {
  const constraints = getPlanConstraints(child.parentSubscriptionPlan);

  return {
    parentSubscriptionPlan: child.parentSubscriptionPlan,
    maxChildProfiles: constraints.maxChildProfiles,
    maxThemesAllowed: child.maxThemesAllowed,
    maxStoriesPerWeekAllowed: child.maxStoriesPerWeekAllowed,
    maxChallengeTypes: child.maxChallengeTypes,
    maxWorldsPerRoadmapAllowed: child.maxWorldsPerRoadmapAllowed,
    maxEpisodesPerWorldAllowed: child.maxEpisodesPerWorldAllowed,
    maxChaptersPerStoryAllowed: child.maxChaptersPerStoryAllowed,
  };
}

export function getReadingPlanStructure(plan: SubscriptionPlan): ReadingPlanStructure {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return {
        worldsPerRoadmapMin: 1,
        worldsPerRoadmapMax: 1,
        storiesPerWorld: 4,
      };
    case SubscriptionPlan.PRO:
      return {
        worldsPerRoadmapMin: 2,
        worldsPerRoadmapMax: 3,
        storiesPerWorld: 6,
      };
    case SubscriptionPlan.PRO_PLUS:
      return {
        worldsPerRoadmapMin: 2,
        worldsPerRoadmapMax: 3,
        storiesPerWorld: 8,
      };
  }
}

export function getReadingPlanStructureFromChild(
  child: Pick<Child, "parentSubscriptionPlan">,
): ReadingPlanStructure {
  return getReadingPlanStructure(child.parentSubscriptionPlan);
}

// Returns available challenge type IDs for a given plan
export function getAvailableChallengesByPlan(plan: SubscriptionPlan): string[] {
  const constraints = getPlanConstraints(plan);

  // Basic challenges: MULTIPLE_CHOICE, TRUE_FALSE, SEQUENCING
  const basicChallenges = [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SEQUENCING",
  ];

  // Core challenges: basic + FILL_BLANK, COMPLETE_WORD, LETTER_DISCRIMINATION
  const coreChallenges = [
    ...basicChallenges,
    "FILL_BLANK",
    "COMPLETE_WORD",
    "LETTER_DISCRIMINATION",
  ];

  // All challenges: core + SOUND_MATCH, READ_ALOUD, WORD_BUILD
  const allChallenges = [
    ...coreChallenges,
    "SOUND_MATCH",
    "READ_ALOUD",
    "WORD_BUILD",
  ];

  switch (constraints.challengeTypesCount) {
    case "basic":
      return basicChallenges;
    case "core":
      return coreChallenges;
    case "all":
      return allChallenges;
  }
}

// Deprecated: kept for backward compatibility
export function getAvailableChallenges(plan: SubscriptionPlan): string[] {
  return getAvailableChallengesByPlan(plan);
}

