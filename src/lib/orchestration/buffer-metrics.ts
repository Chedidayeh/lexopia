import { StoryGenerationStatus } from "@prisma/client";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import { getActiveRoadmapStories } from "./plan-completion";

function isStoryGeneratedAndReady(
  story: ReadingPlanDetailView["roadmaps"][number]["worlds"][number]["stories"][number],
): boolean {
  return (
    story.generationStatus === StoryGenerationStatus.READY &&
    !story.isTtsGenerating
  );
}

export function countGeneratedAhead(plan: ReadingPlanDetailView): number {
  const activeStories = getActiveRoadmapStories(plan);
  if (activeStories.length === 0) {
    return 0;
  }

  const cursorIndex = activeStories.findIndex(
    (entry) => entry.story.progressStatus !== "COMPLETED",
  );

  if (cursorIndex === -1) {
    return 0;
  }

  let generatedAhead = 0;

  for (let index = cursorIndex + 1; index < activeStories.length; index++) {
    if (isStoryGeneratedAndReady(activeStories[index].story)) {
      generatedAhead += 1;
    } else {
      break;
    }
  }

  return generatedAhead;
}

export function needsBufferRefill(plan: ReadingPlanDetailView): boolean {
  return countGeneratedAhead(plan) < plan.storiesPerWeek;
}
