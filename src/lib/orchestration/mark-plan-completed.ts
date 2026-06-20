import "server-only";

import { ReadingPlanStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

export async function markPlanCompleted(planId: string): Promise<void> {
  const plan = await prisma.readingPlan.findUnique({
    where: { id: planId },
    select: { childId: true },
  });

  if (!plan) {
    return;
  }

  await prisma.$transaction([
    prisma.readingPlan.update({
      where: { id: planId },
      data: {
        status: ReadingPlanStatus.COMPLETED,
        isActive: false,
        completedAt: new Date(),
      },
    }),
    prisma.roadmap.updateMany({
      where: { childId: plan.childId, isActive: true },
      data: { isActive: false },
    }),
  ]);
}
