import { z } from "zod";
import { challengeTypeEnum } from "@/src/lib/challenges/challenge-type-schema";

export const continuityBibleSchema = z.object({
  characters: z.array(z.string()).min(1),
  setting: z.string().min(1),
  plotThreads: z.array(z.string()).min(1),
  tone: z.string().min(1),
});

export const episodeBlueprintSchema = z.object({
  episodeNumber: z.number().int().min(1).max(8),
  episodeTitle: z.string().min(1),
  episodeSummary: z.string().min(1),
  challengeTypes: z.array(challengeTypeEnum).min(1),
});

export const storyArcBlueprintSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().min(1),
  continuityBible: continuityBibleSchema,
  episodes: z.array(episodeBlueprintSchema).min(1),
});

export const worldBlueprintSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().min(1).max(3),
  storyArc: storyArcBlueprintSchema,
});

export const roadmapBlueprintSchema = z.object({
  interest: z.string().min(1),
  title: z.string().min(1),
  worlds: z.array(worldBlueprintSchema).min(1),
});

export const planBlueprintSchema = z.object({
  roadmaps: z.array(roadmapBlueprintSchema).min(1),
});

export type PlanBlueprint = z.infer<typeof planBlueprintSchema>;
export type RoadmapBlueprint = z.infer<typeof roadmapBlueprintSchema>;
export type WorldBlueprint = z.infer<typeof worldBlueprintSchema>;
export type StoryArcBlueprint = z.infer<typeof storyArcBlueprintSchema>;
export type EpisodeBlueprint = z.infer<typeof episodeBlueprintSchema>;

export type PlanConstraints = {
  sourceInterests: string[];
  worldsPerRoadmapMin: number;
  worldsPerRoadmapMax: number;
  storiesPerWorld: number;
  assignedChallenges: string[];
  challengesPerStory: number;
};

export function countBlueprintStories(blueprint: PlanBlueprint): number {
  return blueprint.roadmaps.reduce(
    (total, roadmap) =>
      total +
      roadmap.worlds.reduce(
        (worldTotal, world) => worldTotal + world.storyArc.episodes.length,
        0,
      ),
    0,
  );
}

export function validateChallengeDistribution(
  blueprint: PlanBlueprint,
  constraints: Pick<
    PlanConstraints,
    "assignedChallenges" | "challengesPerStory"
  >,
): { valid: true } | { valid: false; error: string } {
  const { assignedChallenges, challengesPerStory } = constraints;
  const coveredTypes = new Set<string>();

  for (const roadmap of blueprint.roadmaps) {
    for (const world of roadmap.worlds) {
      for (const episode of world.storyArc.episodes) {
        if (episode.challengeTypes.length !== challengesPerStory) {
          return {
            valid: false,
            error: `Episode ${episode.episodeNumber} in world "${world.name}" must have exactly ${challengesPerStory} challengeTypes, got ${episode.challengeTypes.length}`,
          };
        }

        for (const challengeType of episode.challengeTypes) {
          if (!assignedChallenges.includes(challengeType)) {
            return {
              valid: false,
              error: `Challenge type "${challengeType}" in episode ${episode.episodeNumber} of world "${world.name}" is not in assigned challenges`,
            };
          }
          coveredTypes.add(challengeType);
        }
      }
    }
  }

  const missingTypes = assignedChallenges.filter(
    (challengeType) => !coveredTypes.has(challengeType),
  );
  if (missingTypes.length > 0) {
    return {
      valid: false,
      error: `Plan must include every assigned challenge type at least once. Missing: ${missingTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

export function validateBlueprintAgainstPlan(
  blueprint: PlanBlueprint,
  constraints: PlanConstraints,
): { valid: true } | { valid: false; error: string } {
  const {
    sourceInterests,
    worldsPerRoadmapMin,
    worldsPerRoadmapMax,
    storiesPerWorld,
    assignedChallenges,
    challengesPerStory,
  } = constraints;

  if (blueprint.roadmaps.length !== sourceInterests.length) {
    return {
      valid: false,
      error: `Expected ${sourceInterests.length} roadmaps, got ${blueprint.roadmaps.length}`,
    };
  }

  const seenInterests = new Set<string>();
  for (const roadmap of blueprint.roadmaps) {
    if (!sourceInterests.includes(roadmap.interest)) {
      return {
        valid: false,
        error: `Interest "${roadmap.interest}" is not in child profile`,
      };
    }
    if (seenInterests.has(roadmap.interest)) {
      return {
        valid: false,
        error: `Duplicate interest "${roadmap.interest}" in blueprint`,
      };
    }
    seenInterests.add(roadmap.interest);

    if (
      roadmap.worlds.length < worldsPerRoadmapMin ||
      roadmap.worlds.length > worldsPerRoadmapMax
    ) {
      return {
        valid: false,
        error: `Roadmap "${roadmap.interest}" must have ${worldsPerRoadmapMin}-${worldsPerRoadmapMax} worlds`,
      };
    }

    const worldOrders = new Set<number>();
    for (const world of roadmap.worlds) {
      if (worldOrders.has(world.order)) {
        return {
          valid: false,
          error: `Duplicate world order ${world.order} in roadmap "${roadmap.interest}"`,
        };
      }
      worldOrders.add(world.order);

      if (world.storyArc.episodes.length !== storiesPerWorld) {
        return {
          valid: false,
          error: `World "${world.name}" must have ${storiesPerWorld} episodes`,
        };
      }

      const episodeNumbers = world.storyArc.episodes
        .map((ep) => ep.episodeNumber)
        .sort((a, b) => a - b);
      const expected = Array.from({ length: storiesPerWorld }, (_, i) => i + 1);
      if (episodeNumbers.some((n, i) => n !== expected[i])) {
        return {
          valid: false,
          error: `World "${world.name}" episodes must be numbered 1-${storiesPerWorld} sequentially`,
        };
      }
    }
  }

  const missingInterests = sourceInterests.filter((i) => !seenInterests.has(i));
  if (missingInterests.length > 0) {
    return {
      valid: false,
      error: `Missing roadmaps for interests: ${missingInterests.join(", ")}`,
    };
  }

  const challengeValidation = validateChallengeDistribution(blueprint, {
    assignedChallenges,
    challengesPerStory,
  });
  if (!challengeValidation.valid) {
    return challengeValidation;
  }

  return { valid: true };
}

export function validateChallengeCoveragePossible(
  constraints: PlanConstraints,
): { valid: true } | { valid: false; error: string } {
  const minStories =
    constraints.sourceInterests.length *
    constraints.worldsPerRoadmapMin *
    constraints.storiesPerWorld;
  const totalSlots = minStories * constraints.challengesPerStory;

  if (totalSlots < constraints.assignedChallenges.length) {
    return {
      valid: false,
      error: `Cannot cover all ${constraints.assignedChallenges.length} assigned challenge types: plan has at most ${totalSlots} challenge slots (${minStories} stories × ${constraints.challengesPerStory} per story)`,
    };
  }

  return { valid: true };
}
