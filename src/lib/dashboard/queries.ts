import { prisma } from "@/src/lib/prisma";
import type { AgeGroup, Badge, ChildProfile, Level, User } from "./types";
import {
  buildDashboardAgeGroups,
  childProfileInclude,
  toChildProfile,
} from "./map-child-profile";

export function getDashboardAgeGroups(): AgeGroup[] {
  return buildDashboardAgeGroups();
}

export async function getParentById(parentId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      newUser: true,
      subscriptionPlan: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    newUser: user.newUser,
    subscriptionPlan: user.subscriptionPlan,
  };
}

export async function getChildProfilesByParent(
  parentId: string,
): Promise<ChildProfile[]> {
  const children = await prisma.child.findMany({
    where: {
      parentId,
      onboardingCompletedAt: { not: null },
    },
    include: childProfileInclude,
    orderBy: { createdAt: "asc" },
  });

  return children.map(toChildProfile);
}

export async function getChildProfileById(
  childId: string,
): Promise<ChildProfile | null> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: childProfileInclude,
  });

  if (!child) return null;
  return toChildProfile(child);
}

export async function getBadges(): Promise<Badge[]> {
  const badges = await prisma.badge.findMany({
    include: {
      level: true,
      translations: true,
    },
    orderBy: {
      level: { levelNumber: "asc" },
    },
  });

  return badges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    level: badge.level
      ? {
          levelNumber: badge.level.levelNumber,
          requiredStars: badge.level.requiredStars,
        }
      : undefined,
    translations: badge.translations.map((translation) => ({
      languageCode: translation.languageCode,
      name: translation.name,
      description: translation.description,
    })),
  }));
}

export async function getLevels(): Promise<Level[]> {
  const levels = await prisma.level.findMany({
    orderBy: { levelNumber: "asc" },
  });

  return levels.map((level) => ({
    levelNumber: level.levelNumber,
    requiredStars: level.requiredStars,
  }));
}
