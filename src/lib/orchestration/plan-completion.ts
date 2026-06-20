import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import { flattenPlanStories } from "@/src/app/[locale]/(core)/child-dashboard/_lib/reading-plan-helpers";

export function isPlanFullyRead(plan: ReadingPlanDetailView): boolean {
  const stories = flattenPlanStories(plan);

  if (stories.length === 0) {
    return false;
  }

  return stories.every(
    (entry) => entry.story.progressStatus === "COMPLETED",
  );
}

export function getActiveRoadmapStories(
  plan: ReadingPlanDetailView,
): ReturnType<typeof flattenPlanStories> {
  const activeRoadmap = plan.roadmaps.find((roadmap) => roadmap.isActive);
  if (!activeRoadmap) {
    return [];
  }

  return flattenPlanStories(plan).filter(
    (entry) => entry.roadmapId === activeRoadmap.id,
  );
}
