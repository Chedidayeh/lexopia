"use server";

import { AgentTrigger } from "@prisma/client";
import { auth } from "@/src/auth";
import { enqueueReadingPlan } from "@/src/lib/reading-plan/enqueue-reading-plan";
import { canManuallyGenerateInitialPlan } from "@/src/lib/reading-plan/plan-eligibility";
import { getActiveReadingPlanStatus, getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import type {
  GeneratePlanResult,
  ReadingPlanStatusView,
  ReadingPlanTabState,
} from "@/src/lib/reading-plan/types";
import { prisma } from "@/src/lib/prisma";

export async function generateReadingPlanAction(
  childId: string,
): Promise<GeneratePlanResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      parentId: session.user.id,
    },
    select: { id: true },
  });

  if (!child) {
    return { success: false, error: "Child not found" };
  }

  if (!(await canManuallyGenerateInitialPlan(childId))) {
    return {
      success: false,
      error: "Initial reading plan has already been created for this child",
    };
  }

  return enqueueReadingPlan({
    childId,
    trigger: AgentTrigger.ONBOARDING,
  });
}

export async function getReadingPlanStatusAction(
  childId: string,
): Promise<ReadingPlanStatusView | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
    select: { id: true },
  });

  if (!child) {
    return null;
  }

  return getActiveReadingPlanStatus(childId);
}

export async function getChildReadingPlanAction(
  childId: string,
): Promise<ReadingPlanTabState | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
    select: { id: true },
  });

  if (!child) {
    return null;
  }

  const [plan, canManuallyGenerateInitialPlanFlag] = await Promise.all([
    getChildReadingPlanDetail(childId),
    canManuallyGenerateInitialPlan(childId),
  ]);

  return {
    plan,
    canManuallyGenerateInitialPlan: canManuallyGenerateInitialPlanFlag,
  };
}
