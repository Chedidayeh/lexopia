import "server-only";

import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  StoryGenerationStatus,
} from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import { getReadingPlanConfigurationFromChild } from "@/src/lib/onboarding/plan-constraints";
import { prisma } from "@/src/lib/prisma";
import { findNextStoryToGenerate } from "./find-next-story";
import { canGenerateStoryThisWeek } from "./weekly-story-limit";
import type { GenerateStoryContentResult } from "./types";

async function closeStaleStoryAgentJobs(storyId: string): Promise<void> {
  await prisma.agentJob.updateMany({
    where: {
      storyId,
      agentType: AgentType.STORY,
      status: { in: [AgentJobStatus.RUNNING, AgentJobStatus.PENDING] },
    },
    data: {
      status: AgentJobStatus.FAILED,
      completedAt: new Date(),
      error: "Superseded by a new generation request",
    },
  });
}

function buildStoryIdempotencyKey(
  storyId: string,
  trigger: AgentTrigger,
): string {
  if (trigger === AgentTrigger.MANUAL_REGENERATION) {
    return `story-content:${storyId}:${Date.now()}`;
  }

  return `story-content:${storyId}:${trigger}`;
}

export async function enqueueStoryContent(params: {
  childId: string;
  storyId: string;
  trigger: AgentTrigger;
  skipNextStoryValidation?: boolean;
}): Promise<GenerateStoryContentResult> {
  const { childId, storyId, trigger, skipNextStoryValidation = false } =
    params;

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { id: true, storiesPerWeek: true },
  });

  if (!child) {
    return { success: false, error: "Child not found" };
  }

  // Check weekly story generation limit for manual triggers
  if (trigger === AgentTrigger.MANUAL_REGENERATION) {
    const weeklyCheck = await canGenerateStoryThisWeek(childId, child.storiesPerWeek);
    if (!weeklyCheck.canGenerate) {
      return {
        success: false,
        error: `Weekly story generation limit reached. You have generated ${weeklyCheck.generatedCount} of ${child.storiesPerWeek} stories this week. Please try again next week.`,
      };
    }
  }

  if (!skipNextStoryValidation) {
    const plan = await getChildReadingPlanDetail(childId);
    const nextStory = findNextStoryToGenerate(plan);

    if (!nextStory || nextStory.storyId !== storyId) {
      return {
        success: false,
        error: "Only the next available story can be generated",
      };
    }
  }

  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      world: { roadmap: { childId } },
    },
    include: {
      storyArc: true,
      world: {
        include: {
          roadmap: {
            select: {
              id: true,
              readingPlanId: true,
              child: {
                select: {
                  parentSubscriptionPlan: true,
                  maxThemesAllowed: true,
                  maxStoriesPerWeekAllowed: true,
                  maxChallengeTypes: true,
                  maxWorldsPerRoadmapAllowed: true,
                  maxEpisodesPerWorldAllowed: true,
                  maxChaptersPerStoryAllowed: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!story?.storyArc || !story.world?.roadmap) {
    return { success: false, error: "Story not found" };
  }

  if (
    story.generationStatus !== StoryGenerationStatus.PENDING &&
    story.generationStatus !== StoryGenerationStatus.FAILED
  ) {
    return {
      success: false,
      error: "Story is not eligible for generation",
    };
  }

  const idempotencyKey = buildStoryIdempotencyKey(storyId, trigger);

  if (trigger !== AgentTrigger.MANUAL_REGENERATION) {
    const existingJob = await prisma.agentJob.findFirst({
      where: {
        OR: [
          { idempotencyKey },
          {
            storyId,
            agentType: AgentType.STORY,
            status: { in: [AgentJobStatus.PENDING, AgentJobStatus.RUNNING] },
          },
        ],
      },
    });

    if (existingJob) {
      return {
        success: true,
        storyId,
        agentJobId: existingJob.id,
      };
    }
  }

  if (story.generationStatus === StoryGenerationStatus.FAILED) {
    await closeStaleStoryAgentJobs(storyId);
  } else {
    const runningJob = await prisma.agentJob.findFirst({
      where: {
        storyId,
        agentType: AgentType.STORY,
        status: AgentJobStatus.RUNNING,
      },
    });

    if (runningJob) {
      return {
        success: false,
        error: "Story content is already being generated",
      };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.story.update({
      where: { id: storyId },
      data: {
        generationStatus: StoryGenerationStatus.GENERATING,
        generationStartedAt: new Date(),
      },
    });

    const agentJob = await tx.agentJob.create({
      data: {
        agentType: AgentType.STORY,
        status: AgentJobStatus.PENDING,
        trigger,
        childId,
        readingPlanId: story.world.roadmap.readingPlanId,
        roadmapId: story.world.roadmap.id,
        worldId: story.worldId,
        storyArcId: story.storyArcId,
        storyId,
        idempotencyKey,
        inputSnapshot: {
          childId,
          storyId,
          episodeNumber: story.episodeNumber,
          readingPlanConfiguration: getReadingPlanConfigurationFromChild(
            story.world.roadmap.child,
          ),
        },
      },
    });

    return { agentJob };
  });

  try {
    await inngest.send({
      name: INNGEST_EVENTS.STORY_CONTENT_REQUESTED,
      data: {
        storyId,
        agentJobId: result.agentJob.id,
        childId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to enqueue story content job";

    await prisma.$transaction([
      prisma.story.update({
        where: { id: storyId },
        data: {
          generationStatus: StoryGenerationStatus.FAILED,
          generationCompletedAt: new Date(),
        },
      }),
      prisma.agentJob.update({
        where: { id: result.agentJob.id },
        data: {
          status: AgentJobStatus.FAILED,
          error: message,
          completedAt: new Date(),
        },
      }),
    ]);

    return { success: false, error: message };
  }

  return {
    success: true,
    storyId,
    agentJobId: result.agentJob.id,
  };
}
