import "server-only";

import { AgentTrigger } from "@prisma/client";
import { advanceChildProgression } from "@/src/lib/orchestration/advance-progression";
import {
  evaluateChildOrchestration,
  loadOrchestrationContext,
} from "@/src/lib/orchestration/evaluate-child";
import { markPlanCompleted } from "@/src/lib/orchestration/mark-plan-completed";
import { enqueueReadingPlan } from "@/src/lib/reading-plan/enqueue-reading-plan";
import { enqueueStoryContent } from "@/src/lib/story-content/enqueue-story-content";
import { prisma } from "@/src/lib/prisma";

export type RunChildOrchestrationResult = {
  action: "noop" | "plan" | "replan" | "story";
  reason: string;
  readingPlanId?: string;
  agentJobId?: string;
  storyId?: string;
  error?: string;
};

function resolvePlanningTrigger(
  orchestrationTrigger: AgentTrigger,
): AgentTrigger {
  if (orchestrationTrigger === AgentTrigger.MANUAL_REGENERATION) {
    return AgentTrigger.MANUAL_REGENERATION;
  }

  return AgentTrigger.SCHEDULED_WEEKLY;
}

function resolveStoryTrigger(orchestrationTrigger: AgentTrigger): AgentTrigger {
  if (orchestrationTrigger === AgentTrigger.MANUAL_REGENERATION) {
    return AgentTrigger.MANUAL_REGENERATION;
  }

  return orchestrationTrigger === AgentTrigger.SCHEDULED_WEEKLY
    ? AgentTrigger.SCHEDULED_WEEKLY
    : AgentTrigger.STORY_UNLOCK;
}

export async function runChildOrchestration(
  childId: string,
  trigger: AgentTrigger,
): Promise<RunChildOrchestrationResult> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      onboardingCompletedAt: true,
      interests: true,
    },
  });

  if (!child?.onboardingCompletedAt || child.interests.length === 0) {
    return { action: "noop", reason: "child_not_eligible" };
  }

  await advanceChildProgression(childId);

  const context = await loadOrchestrationContext(childId, trigger);
  const decision = evaluateChildOrchestration(context);

  if (decision.action === "replan" && context.plan) {
    await markPlanCompleted(context.plan.planId);

    const result = await enqueueReadingPlan({
      childId,
      trigger: resolvePlanningTrigger(trigger),
    });

    if (!result.success) {
      return {
        action: "replan",
        reason: decision.reason,
        error: result.error,
      };
    }

    return {
      action: "replan",
      reason: decision.reason,
      readingPlanId: result.readingPlanId,
      agentJobId: result.agentJobId,
    };
  }

  if (decision.action === "noop") {
    return { action: "noop", reason: decision.reason };
  }

  if (decision.action === "plan") {
    const result = await enqueueReadingPlan({
      childId,
      trigger: resolvePlanningTrigger(trigger),
    });

    if (!result.success) {
      return {
        action: decision.action,
        reason: decision.reason,
        error: result.error,
      };
    }

    return {
      action: decision.action,
      reason: decision.reason,
      readingPlanId: result.readingPlanId,
      agentJobId: result.agentJobId,
    };
  }

  if (decision.action === "replan") {
    return { action: "noop", reason: "replan_without_active_plan" };
  }

  if (decision.action === "story") {
    const storyTrigger = resolveStoryTrigger(trigger);

    const result = await enqueueStoryContent({
      childId,
      storyId: decision.storyId,
      trigger: storyTrigger,
    });

    if (!result.success) {
      return {
        action: "story",
        reason: decision.reason,
        storyId: decision.storyId,
        error: result.error,
      };
    }

    return {
      action: "story",
      reason: decision.reason,
      storyId: result.storyId,
      agentJobId: result.agentJobId,
    };
  }

  return { action: "noop", reason: "unhandled_decision" };
}
