import type { ContentStatus } from "@/src/types/types";
import type {
  ReadingPlanDetailView,
  ReadingPlanEpisodeView,
  ReadingPlanWorldView,
} from "@/src/lib/reading-plan/types";

export type ChildStoryAccess =
  | { kind: "continue" | "start" | "completed" }
  | { kind: "locked"; reason: "not_ready" | "world_locked" | "previous_incomplete" }
  | { kind: "generating" };

export type FlatPlanStory = {
  story: ReadingPlanEpisodeView;
  world: ReadingPlanWorldView;
  roadmapId: string;
  roadmapTitle: string | null;
  interest: string;
  previousStory: ReadingPlanEpisodeView | null;
  previousWorldStories: ReadingPlanEpisodeView[] | null;
};

export function flattenPlanStories(
  plan: ReadingPlanDetailView,
): FlatPlanStory[] {
  const items: FlatPlanStory[] = [];

  for (const roadmap of plan.roadmaps) {
    const sortedWorlds = [...roadmap.worlds].sort((a, b) => a.order - b.order);
    for (let worldIndex = 0; worldIndex < sortedWorlds.length; worldIndex++) {
      const world = sortedWorlds[worldIndex];
      const sorted = [...world.stories].sort((a, b) => a.order - b.order);
      const previousWorld = worldIndex > 0 ? sortedWorlds[worldIndex - 1] : null;
      const previousWorldStories = previousWorld
        ? [...previousWorld.stories].sort((a, b) => a.order - b.order)
        : null;

      sorted.forEach((story, index) => {
        items.push({
          story,
          world,
          roadmapId: roadmap.id,
          roadmapTitle: roadmap.title,
          interest: roadmap.interest,
          previousStory: index > 0 ? sorted[index - 1] : null,
          previousWorldStories,
        });
      });
    }
  }

  return items;
}

export function getChildStoryAccess(
  story: ReadingPlanEpisodeView,
  world: ReadingPlanWorldView,
  previousStory: ReadingPlanEpisodeView | null,
  previousWorldStories: ReadingPlanEpisodeView[] | null,
): ChildStoryAccess {
  if (
    story.generationStatus === "GENERATING" ||
    story.isTtsGenerating
  ) {
    return { kind: "generating" };
  }

  if (story.generationStatus !== "READY") {
    return { kind: "locked", reason: "not_ready" };
  }

  // Check if all stories in previous world are completed (for non-first stories in world)
  if (previousWorldStories && previousWorldStories.length > 0) {
    const allPreviousWorldCompleted = previousWorldStories.every(
      (s) => s.progressStatus === "COMPLETED",
    );
    if (!allPreviousWorldCompleted) {
      return { kind: "locked", reason: "world_locked" };
    }
  }

  if (world.status === "LOCKED") {
    return { kind: "locked", reason: "world_locked" };
  }

  if (story.progressStatus === "COMPLETED") {
    return { kind: "completed" };
  }

  if (story.progressStatus === "IN_PROGRESS") {
    return { kind: "continue" };
  }

  if (
    previousStory &&
    previousStory.progressStatus !== "COMPLETED" &&
    story.progressStatus !== "AVAILABLE"
  ) {
    return { kind: "locked", reason: "previous_incomplete" };
  }

  if (
    story.progressStatus === "AVAILABLE" ||
    story.progressStatus === null ||
    story.progressStatus === "LOCKED"
  ) {
    return { kind: "start" };
  }

  return { kind: "locked", reason: "previous_incomplete" };
}

export function findPrimaryStoryAction(
  plan: ReadingPlanDetailView,
): (FlatPlanStory & { access: ChildStoryAccess }) | null {
  const flatStories = flattenPlanStories(plan);

  const continueStory = flatStories.find((entry) => {
    const access = getChildStoryAccess(
      entry.story,
      entry.world,
      entry.previousStory,
      entry.previousWorldStories,
    );
    return access.kind === "continue";
  });

  if (continueStory) {
    return {
      ...continueStory,
      access: getChildStoryAccess(
        continueStory.story,
        continueStory.world,
        continueStory.previousStory,
        continueStory.previousWorldStories,
      ),
    };
  }

  const startStory = flatStories.find((entry) => {
    const access = getChildStoryAccess(
      entry.story,
      entry.world,
      entry.previousStory,
      entry.previousWorldStories,
    );
    return access.kind === "start";
  });

  if (startStory) {
    return {
      ...startStory,
      access: getChildStoryAccess(
        startStory.story,
        startStory.world,
        startStory.previousStory,
        startStory.previousWorldStories,
      ),
    };
  }

  return null;
}

export function planHasPendingContent(plan: ReadingPlanDetailView): boolean {
  if (plan.status === "GENERATING") return true;

  return flattenPlanStories(plan).some((entry) => {
    const { story } = entry;
    return (
      story.generationStatus === "GENERATING" ||
      story.generationStatus === "PENDING" ||
      story.isTtsGenerating
    );
  });
}

export function getStoryDisplayTitle(story: ReadingPlanEpisodeView): string {
  return story.episodeTitle || story.title;
}

export function isStoryReadable(access: ChildStoryAccess): boolean {
  return (
    access.kind === "continue" ||
    access.kind === "start" ||
    access.kind === "completed"
  );
}

export function countCompletedStories(plan: ReadingPlanDetailView): number {
  return flattenPlanStories(plan).filter(
    (entry) => entry.story.progressStatus === "COMPLETED",
  ).length;
}

export function mapProgressStatusLabel(
  progressStatus: ContentStatus | null,
): "completed" | "inProgress" | "available" | "locked" | null {
  if (!progressStatus) return null;
  switch (progressStatus) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
      return "inProgress";
    case "AVAILABLE":
      return "available";
    default:
      return "locked";
  }
}
