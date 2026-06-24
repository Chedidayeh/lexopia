import { ReadingPlanStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

const SUCCESSFUL_PLAN_STATUSES: ReadingPlanStatus[] = [
  ReadingPlanStatus.ACTIVE,
  ReadingPlanStatus.COMPLETED,
  ReadingPlanStatus.SUPERSEDED,
];

export function evaluateInitialPlanEligibility(
  plans: { status: ReadingPlanStatus }[],
): boolean {
  if (plans.length === 0) {
    return true;
  }

  const hasSuccessfulPlanHistory = plans.some((plan) =>
    SUCCESSFUL_PLAN_STATUSES.includes(plan.status),
  );
  if (hasSuccessfulPlanHistory) {
    return false;
  }

  return plans[0].status === ReadingPlanStatus.FAILED;
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
