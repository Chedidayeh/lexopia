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
  birthDate?: Date | null;
  gender?: string;
  primaryLanguage?: string;
  readingLevel?: string;
  assignedChallenges?: string[];
  interests?: string[];
  favoriteCharacterType?: string;
  storyTone?: string;
  storiesPerWeek?: number;
  sessionDurationMins?: number;
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
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.primaryLanguage !== undefined ? { primaryLanguage: input.primaryLanguage as any } : {}),
      ...(input.readingLevel !== undefined ? { readingLevel: input.readingLevel as any } : {}),
      ...(input.assignedChallenges !== undefined ? { assignedChallenges: input.assignedChallenges } : {}),
      ...(input.interests !== undefined ? { interests: input.interests } : {}),
      ...(input.favoriteCharacterType !== undefined ? { favoriteCharacterType: input.favoriteCharacterType } : {}),
      ...(input.storyTone !== undefined ? { storyTone: input.storyTone } : {}),
      ...(input.storiesPerWeek !== undefined ? { storiesPerWeek: input.storiesPerWeek } : {}),
      ...(input.sessionDurationMins !== undefined ? { sessionDurationMins: input.sessionDurationMins } : {}),
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
