"use server";

import { auth } from "@/src/auth";
import type { ChildProfile } from "@/src/lib/dashboard/types";
import {
  getChildProfileById,
  getChildProfilesByParent,
} from "@/src/lib/dashboard/queries";
import { prisma } from "@/src/lib/prisma";

export async function getChildProfilesByParentAction(
  parentId: string,
): Promise<ChildProfile[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  if (session.user.role !== "ADMIN" && session.user.id !== parentId) {
    return [];
  }

  return getChildProfilesByParent(parentId);
}

export async function getChildByIdAction(
  childId: string,
): Promise<ChildProfile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });

  if (!child) return null;

  if (session.user.role !== "ADMIN" && child.parentId !== session.user.id) {
    return null;
  }

  return getChildProfileById(childId);
}

export async function toggleWeeklyReportsAction(
  _childId: string,
  _enabled: boolean,
): Promise<{ success: boolean }> {
  // Weekly reports are not persisted on Child in the current schema yet.
  return { success: true };
}

export async function updateNotificationSettingsAction(
  childId: string,
  activateNotifications: boolean,
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });

  if (!child || child.parentId !== session.user.id) {
    return { success: false };
  }

  await prisma.child.update({
    where: { id: childId },
    data: { activateNotifications },
  });

  return { success: true };
}

export async function updateChildGeneralSettingsAction(input: {
  childId: string;
  name?: string;
  storiesPerWeek?: number;
  interests?: string[];
}): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const child = await prisma.child.findUnique({
    where: { id: input.childId },
    select: { parentId: true },
  });

  if (!child || child.parentId !== session.user.id) {
    return { success: false };
  }

  await prisma.child.update({
    where: { id: input.childId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.storiesPerWeek !== undefined
        ? { storiesPerWeek: input.storiesPerWeek }
        : {}),
      ...(input.interests !== undefined ? { interests: input.interests } : {}),
    },
  });

  return { success: true };
}

export async function deleteChildAction(
  childId: string,
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });

  if (!child || child.parentId !== session.user.id) {
    return { success: false };
  }

  await prisma.child.delete({ where: { id: childId } });
  return { success: true };
}
