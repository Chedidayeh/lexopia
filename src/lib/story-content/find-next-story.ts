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

  const sortedRoadmaps = [...plan.roadmaps].sort((a, b) => a.order - b.order);

  for (let roadmapIndex = 0; roadmapIndex < sortedRoadmaps.length; roadmapIndex++) {
    const roadmap = sortedRoadmaps[roadmapIndex];
    if (!roadmap.isActive) {
      continue;
    }

    const sortedWorlds = [...roadmap.worlds].sort((a, b) => a.order - b.order);
    const unlockedWorld = sortedWorlds.find(
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

    if (storyIndex !== -1) {
      const story = unlockedWorld.stories[storyIndex];

      return {
        storyId: story.id,
        episodeTitle: story.episodeTitle || story.title,
        worldName: unlockedWorld.name,
        roadmapTitle: roadmap.title || roadmap.interest,
        generationStatus: story.generationStatus,
      };
    }

    // If current unlocked world has all stories generated, check next locked world
    const allStoriesGenerated = unlockedWorld.stories.every(
      (story) => story.generationStatus === StoryGenerationStatus.READY,
    );
    if (allStoriesGenerated) {
      const worldIndex = sortedWorlds.findIndex((w) => w.id === unlockedWorld.id);
      const nextWorld = sortedWorlds[worldIndex + 1];
      if (nextWorld && nextWorld.status === ContentStatus.LOCKED) {
        const nextStoryIndex = nextWorld.stories.findIndex(
          (episode, index) =>
            GENERATABLE_STATUSES.includes(episode.generationStatus) &&
            priorStoriesAreGenerated(nextWorld.stories, index),
        );

        if (nextStoryIndex !== -1) {
          const story = nextWorld.stories[nextStoryIndex];

          return {
            storyId: story.id,
            episodeTitle: story.episodeTitle || story.title,
            worldName: nextWorld.name,
            roadmapTitle: roadmap.title || roadmap.interest,
            generationStatus: story.generationStatus,
          };
        }
      }
    }

    // If all worlds in current roadmap have all stories generated, check next roadmap
    const allRoadmapStoriesGenerated = sortedWorlds.every((world) =>
      world.stories.every((story) => story.generationStatus === StoryGenerationStatus.READY),
    );
    if (allRoadmapStoriesGenerated) {
      const nextRoadmap = sortedRoadmaps[roadmapIndex + 1];
      if (nextRoadmap) {
        const nextSortedWorlds = [...nextRoadmap.worlds].sort((a, b) => a.order - b.order);
        const firstWorld = nextSortedWorlds[0];
        if (firstWorld) {
          const nextStoryIndex = firstWorld.stories.findIndex(
            (episode, index) =>
              GENERATABLE_STATUSES.includes(episode.generationStatus) &&
              priorStoriesAreGenerated(firstWorld.stories, index),
          );

          if (nextStoryIndex !== -1) {
            const story = firstWorld.stories[nextStoryIndex];

            return {
              storyId: story.id,
              episodeTitle: story.episodeTitle || story.title,
              worldName: firstWorld.name,
              roadmapTitle: nextRoadmap.title || nextRoadmap.interest,
              generationStatus: story.generationStatus,
            };
          }
        }
      }
    }
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
