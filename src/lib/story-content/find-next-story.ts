import { ContentStatus, StoryGenerationStatus } from "@prisma/client";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import type { NextStoryToGenerate } from "./types";

const GENERATABLE_STATUSES: StoryGenerationStatus[] = [
  StoryGenerationStatus.PENDING,
  StoryGenerationStatus.FAILED,
];

function priorStoriesAreGenerated(
  stories: ReadingPlanDetailView["roadmaps"][number]["worlds"][number]["stories"],
  index: number,
): boolean {
  if (index === 0) {
    return true;
  }

  return stories
    .slice(0, index)
    .every((story) => story.generationStatus === StoryGenerationStatus.READY);
}

export function findNextStoryToGenerate(
  plan: ReadingPlanDetailView | null,
): NextStoryToGenerate | null {
  if (!plan || plan.status !== "ACTIVE") {
    return null;
  }

  if (planHasGeneratingStory(plan)) {
    return null;
  }

  for (const roadmap of plan.roadmaps) {
    if (!roadmap.isActive) {
      continue;
    }

    const unlockedWorld = roadmap.worlds.find(
      (world) => world.status !== ContentStatus.LOCKED,
    );
    if (!unlockedWorld) {
      continue;
    }

    const storyIndex = unlockedWorld.stories.findIndex(
      (episode, index) =>
        GENERATABLE_STATUSES.includes(episode.generationStatus) &&
        priorStoriesAreGenerated(unlockedWorld.stories, index),
    );

    if (storyIndex === -1) {
      continue;
    }

    const story = unlockedWorld.stories[storyIndex];

    return {
      storyId: story.id,
      episodeTitle: story.episodeTitle || story.title,
      worldName: unlockedWorld.name,
      roadmapTitle: roadmap.title || roadmap.interest,
      generationStatus: story.generationStatus,
    };
  }

  return null;
}

export function planHasGeneratingStory(plan: ReadingPlanDetailView | null): boolean {
  if (!plan) return false;

  return plan.roadmaps.some((roadmap) =>
    roadmap.worlds.some((world) =>
      world.stories.some(
        (story) => story.generationStatus === StoryGenerationStatus.GENERATING,
      ),
    ),
  );
}
