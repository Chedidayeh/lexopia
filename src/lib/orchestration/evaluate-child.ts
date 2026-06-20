import { AgentJobStatus, AgentTrigger, AgentType } from "@prisma/client";
import { findNextStoryToGenerate } from "@/src/lib/story-content/find-next-story";
import { getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import { prisma } from "@/src/lib/prisma";
import { needsBufferRefill } from "./buffer-metrics";
import { isPlanFullyRead } from "./plan-completion";
import { ReadingPlanDetailView } from "../reading-plan/types";

export type OrchestrationDecision =
  | { action: "noop"; reason: string }
  | { action: "plan"; reason: string }
  | { action: "replan"; reason: string }
  | { action: "story"; storyId: string; reason: string };

export type OrchestrationContext = {
  plan: ReadingPlanDetailView | null;
  hasPendingPlanningJob: boolean;
  hasRecentScheduledPlanning: boolean;
};

export function evaluateChildOrchestration(
  context: OrchestrationContext,
): OrchestrationDecision {
  const { plan, hasPendingPlanningJob, hasRecentScheduledPlanning } = context;

  if (hasPendingPlanningJob) {
    return { action: "noop", reason: "planning_job_in_progress" };
  }

  if (!plan) {
    if (hasRecentScheduledPlanning) {
      return { action: "noop", reason: "recent_scheduled_planning" };
    }

    return { action: "plan", reason: "no_active_plan" };
  }

  if (plan.status === "GENERATING") {
    return { action: "noop", reason: "plan_generating" };
  }

  if (plan.status === "ACTIVE" && isPlanFullyRead(plan)) {
    return { action: "replan", reason: "plan_fully_read" };
  }

  if (plan.status !== "ACTIVE") {
    if (hasRecentScheduledPlanning) {
      return { action: "noop", reason: "recent_scheduled_planning" };
    }

    return { action: "plan", reason: "no_active_plan" };
  }

  if (!needsBufferRefill(plan)) {
    return { action: "noop", reason: "buffer_sufficient" };
  }

  const nextStory = findNextStoryToGenerate(plan);
  if (!nextStory) {
    return { action: "noop", reason: "no_story_to_generate" };
  }

  return {
    action: "story",
    storyId: nextStory.storyId,
    reason: "buffer_refill",
  };
}

export function isScheduledPlanningTrigger(trigger: AgentTrigger): boolean {
  return trigger === AgentTrigger.SCHEDULED_WEEKLY;
}

export async function loadOrchestrationContext(
  childId: string,
  trigger: AgentTrigger,
): Promise<OrchestrationContext & { childId: string }> {
  const plan = await getChildReadingPlanDetail(childId);

  const pendingPlanningJob = await prisma.agentJob.findFirst({
    where: {
      childId,
      agentType: AgentType.PLANNING,
      status: { in: [AgentJobStatus.PENDING, AgentJobStatus.RUNNING] },
    },
    select: { id: true },
  });

  let hasRecentScheduledPlanning = false;

  if (isScheduledPlanningTrigger(trigger)) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentJob = await prisma.agentJob.findFirst({
      where: {
        childId,
        agentType: AgentType.PLANNING,
        trigger: AgentTrigger.SCHEDULED_WEEKLY,
        createdAt: { gte: weekAgo },
        status: {
          in: [
            AgentJobStatus.PENDING,
            AgentJobStatus.RUNNING,
            AgentJobStatus.SUCCEEDED,
          ],
        },
      },
      select: { id: true },
    });
    hasRecentScheduledPlanning = !!recentJob;
  }

  return {
    childId,
    plan,
    hasPendingPlanningJob: !!pendingPlanningJob,
    hasRecentScheduledPlanning,
  };
}
