import "server-only";

import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  StoryGenerationStatus,
} from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { prisma } from "@/src/lib/prisma";
import type { EnqueueStoryTtsResult } from "./types";

export async function enqueueStoryTts(params: {
  storyId: string;
  childId: string;
  parentAgentJobId: string;
}): Promise<EnqueueStoryTtsResult> {
  const { storyId, childId, parentAgentJobId } = params;

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      world: {
        include: {
          roadmap: {
            select: {
              id: true,
              readingPlanId: true,
            },
          },
        },
      },
    },
  });

  if (!story?.world?.roadmap) {
    return { success: false, error: "Story not found" };
  }

  if (story.generationStatus !== StoryGenerationStatus.READY) {
    return {
      success: false,
      error: "Story must be READY before TTS generation",
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const agentJob = await tx.agentJob.create({
      data: {
        agentType: AgentType.TTS,
        status: AgentJobStatus.PENDING,
        trigger: AgentTrigger.MANUAL_REGENERATION,
        childId,
        readingPlanId: story.world!.roadmap!.readingPlanId,
        roadmapId: story.world!.roadmap!.id,
        worldId: story.worldId,
        storyArcId: story.storyArcId,
        storyId,
        parentJobId: parentAgentJobId,
        idempotencyKey: `story-tts:${storyId}:${Date.now()}`,
        inputSnapshot: { storyId, childId, parentAgentJobId },
      },
    });

    return { agentJob };
  });

  try {
    await inngest.send({
      name: INNGEST_EVENTS.STORY_TTS_REQUESTED,
      data: {
        storyId,
        agentJobId: result.agentJob.id,
        childId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue TTS job";

    await prisma.agentJob.update({
      where: { id: result.agentJob.id },
      data: {
        status: AgentJobStatus.FAILED,
        completedAt: new Date(),
        error: message,
      },
    });

    return { success: false, error: message };
  }

  return {
    success: true,
    storyId,
    agentJobId: result.agentJob.id,
  };
}
