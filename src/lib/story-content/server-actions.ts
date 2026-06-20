"use server";

import { AgentTrigger } from "@prisma/client";
import { auth } from "@/src/auth";
import { enqueueStoryContent } from "@/src/lib/story-content/enqueue-story-content";
import type { GenerateStoryContentResult } from "@/src/lib/story-content/types";
import { prisma } from "@/src/lib/prisma";

export async function generateStoryContentAction(
  childId: string,
  storyId: string,
): Promise<GenerateStoryContentResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
    select: { id: true },
  });

  if (!child) {
    return { success: false, error: "Child not found" };
  }

  return enqueueStoryContent({
    childId,
    storyId,
    trigger: AgentTrigger.MANUAL_REGENERATION,
  });
}
