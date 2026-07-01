import "server-only";

import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  ReadingPlanStatus,
} from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { prisma } from "@/src/lib/prisma";
import {
  getReadingPlanConfigurationFromChild,
  getReadingPlanStructureFromChild,
} from "@/src/lib/onboarding/plan-constraints";
import type { GeneratePlanResult } from "./types";

export async function enqueueReadingPlan(params: {
  childId: string;
  trigger: AgentTrigger;
}): Promise<GeneratePlanResult> {
  const { childId, trigger } = params;

  const child = await prisma.child.findUnique({
    where: { id: childId },
  });

  if (!child) {
    return { success: false, error: "Child not found" };
  }

  if (!child.onboardingCompletedAt) {
    return { success: false, error: "Child onboarding is not complete" };
  }

  if (!child.interests.length) {
    return { success: false, error: "Child has no interests to plan around" };
  }

  const generatingPlan = await prisma.readingPlan.findFirst({
    where: {
      childId,
      status: ReadingPlanStatus.GENERATING,
    },
  });

  if (generatingPlan) {
    return {
      success: false,
      error: "A reading plan is already being generated",
    };
  }

  const pendingPlanningJob = await prisma.agentJob.findFirst({
    where: {
      childId,
      agentType: AgentType.PLANNING,
      status: { in: [AgentJobStatus.PENDING, AgentJobStatus.RUNNING] },
    },
  });

  if (pendingPlanningJob) {
    return {
      success: false,
      error: "A planning job is already in progress",
    };
  }

  const latestPlan = await prisma.readingPlan.findFirst({
    where: { childId },
    orderBy: { planNumber: "desc" },
    select: { planNumber: true },
  });

  const planNumber = (latestPlan?.planNumber ?? 0) + 1;
  const readingPlanConfiguration = getReadingPlanConfigurationFromChild(child);
  const readingPlanStructure = getReadingPlanStructureFromChild(child);

  const result = await prisma.$transaction(async (tx) => {
    await tx.readingPlan.updateMany({
      where: { childId, isActive: true },
      data: {
        isActive: false,
        status: ReadingPlanStatus.SUPERSEDED,
      },
    });

    await tx.roadmap.updateMany({
      where: { childId, isActive: true },
      data: { isActive: false },
    });

    const readingPlan = await tx.readingPlan.create({
      data: {
        childId,
        parentId: child.parentId,
        status: ReadingPlanStatus.GENERATING,
        isActive: false,
        planNumber,
        startedAt: new Date(),
        generationStartedAt: new Date(),
        storiesPerWeek: child.storiesPerWeek,
        sessionDurationMins: child.sessionDurationMins,
        sourceInterests: child.interests,
        readingLevel: child.readingLevel,
        primaryLanguage: child.primaryLanguage,
        assignedChallenges: child.assignedChallenges,
        favoriteCharacterType: child.favoriteCharacterType,
        storyTone: child.storyTone,
        worldsPerRoadmapMin: readingPlanStructure.worldsPerRoadmapMin,
        worldsPerRoadmapMax: readingPlanStructure.worldsPerRoadmapMax,
        storiesPerWorld: readingPlanStructure.storiesPerWorld,
      },
    });

    const agentJob = await tx.agentJob.create({
      data: {
        agentType: AgentType.PLANNING,
        status: AgentJobStatus.PENDING,
        trigger,
        childId,
        readingPlanId: readingPlan.id,
        idempotencyKey: `planning:${childId}:${planNumber}`,
        inputSnapshot: {
          childId,
          planNumber,
          sourceInterests: child.interests,
          readingPlanConfiguration,
          readingPlanStructure,
        },
      },
    });

    return { readingPlan, agentJob };
  });

  try {
    await inngest.send({
      name: INNGEST_EVENTS.PLANNING_REQUESTED,
      data: {
        readingPlanId: result.readingPlan.id,
        agentJobId: result.agentJob.id,
        childId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue planning job";

    // Delete the created plan and job instead of marking them as failed
    await prisma.$transaction([
      prisma.agentJob.delete({
        where: { id: result.agentJob.id },
      }),
      prisma.readingPlan.delete({
        where: { id: result.readingPlan.id },
      }),
    ]);

    return { success: false, error: message };
  }

  return {
    success: true,
    readingPlanId: result.readingPlan.id,
    agentJobId: result.agentJob.id,
  };
}
