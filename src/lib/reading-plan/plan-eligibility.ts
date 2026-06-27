import { ReadingPlanStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

const SUCCESSFUL_PLAN_STATUSES: ReadingPlanStatus[] = [
  ReadingPlanStatus.ACTIVE,
  ReadingPlanStatus.COMPLETED,
  ReadingPlanStatus.SUPERSEDED,
];

/**
 * Check if a new plan can be generated based on existing plan history
 * Returns true if:
 * - No plans exist (first plan)
 * - Latest plan is FAILED (retry after failure)
 * - Latest plan is COMPLETED (generate next plan after completion)
 */
export function evaluateInitialPlanEligibility(
  plans: { status: ReadingPlanStatus }[],
): boolean {
  if (plans.length === 0) {
    return true;
  }

  const latestPlan = plans[0];

  // Allow generating new plan if latest plan is completed
  if (latestPlan.status === ReadingPlanStatus.COMPLETED) {
    return true;
  }

  // Allow retry if latest plan failed
  if (latestPlan.status === ReadingPlanStatus.FAILED) {
    return true;
  }

  // Don't allow if plan is still active or generating
  if (latestPlan.status === ReadingPlanStatus.ACTIVE ||
      latestPlan.status === ReadingPlanStatus.GENERATING ||
      latestPlan.status === ReadingPlanStatus.PAUSED ||
      latestPlan.status === ReadingPlanStatus.DRAFT) {
    return false;
  }

  // Don't allow if plan was superseded (already has a newer plan)
  if (latestPlan.status === ReadingPlanStatus.SUPERSEDED) {
    return false;
  }

  return false;
}

export async function canManuallyGenerateInitialPlan(
  childId: string,
): Promise<boolean> {
  const plans = await prisma.readingPlan.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return evaluateInitialPlanEligibility(plans);
}
