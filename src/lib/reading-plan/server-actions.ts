"use server";

import { AgentTrigger } from "@prisma/client";
import { auth } from "@/src/auth";
import { enqueueReadingPlan } from "@/src/lib/reading-plan/enqueue-reading-plan";
import { getActiveReadingPlanStatus, getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import type {
  GeneratePlanResult,
  ReadingPlanDetailView,
  ReadingPlanStatusView,
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

  return enqueueReadingPlan({
    childId,
    trigger: AgentTrigger.MANUAL_REGENERATION,
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
): Promise<ReadingPlanDetailView | null> {
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

  return getChildReadingPlanDetail(childId);
}
