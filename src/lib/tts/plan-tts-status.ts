import { AgentJobStatus, AgentType } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";

export async function getStoryIdsWithGeneratingTts(
  storyIds: string[],
): Promise<Set<string>> {
  if (storyIds.length === 0) {
    return new Set();
  }

  const jobs = await prisma.agentJob.findMany({
    where: {
      storyId: { in: storyIds },
      agentType: AgentType.TTS,
      status: AgentJobStatus.RUNNING,
    },
    select: { storyId: true },
  });

  return new Set(
    jobs.map((job) => job.storyId).filter((id): id is string => Boolean(id)),
  );
}

export function planHasGeneratingTts(
  plan: ReadingPlanDetailView | null,
): boolean {
  if (!plan) {
    return false;
  }

  return plan.roadmaps.some((roadmap) =>
    roadmap.worlds.some((world) =>
      world.stories.some((story) => story.isTtsGenerating),
    ),
  );
}
