import type { Badge, ChildProfile } from "@Lexopia/shared-types";

export type AchievementStats = {
  displayBadges: Badge[];
  unlockedBadgeIds: Set<string>;
  unlockedCount: number;
  totalCount: number;
  totalStars: number;
  currentLevel: number;
  nextBadge: Badge | null;
  starsToNextBadge: number;
  hasNoBadgeCatalog: boolean;
  hasAnyUnlocked: boolean;
};

function getEarnedBadgeIds(profile: ChildProfile | undefined): Set<string> {
  const earned = new Set<string>();
  profile?.badges?.forEach((entry) => earned.add(entry.badgeId));
  return earned;
}

/**
 * A badge is unlocked when:
 * 1. Recorded in ChildBadge (authoritative earned record), or
 * 2. Child totalStars meets the level threshold (schema: badge ↔ level ↔ requiredStars)
 */
export function isBadgeUnlocked(
  badge: Badge,
  profile: ChildProfile | undefined,
  earnedBadgeIds: Set<string>,
): boolean {
  if (earnedBadgeIds.has(badge.id)) {
    return true;
  }

  if (!badge.level) {
    return false;
  }

  const totalStars = profile?.totalStars ?? 0;
  const requiredStars = badge.level?.requiredStars;

  if (typeof requiredStars === "number" && totalStars >= requiredStars) {
    return true;
  }

  return false;
}

export function getAchievementStats(
  profile: ChildProfile | undefined,
  allAvailableBadges: Badge[] = [],
): AchievementStats {
  const displayBadges = [...allAvailableBadges].sort(
    (a, b) =>
      (a.level?.levelNumber ?? 0) - (b.level?.levelNumber ?? 0),
  );

  const earnedBadgeIds = getEarnedBadgeIds(profile);
  const unlockedBadgeIds = new Set<string>();

  for (const badge of displayBadges) {
    if (isBadgeUnlocked(badge, profile, earnedBadgeIds)) {
      unlockedBadgeIds.add(badge.id);
    }
  }

  const totalStars = profile?.totalStars ?? 0;
  const currentLevel = profile?.currentLevel ?? 1;

  const nextBadge =
    displayBadges.find((badge) => !unlockedBadgeIds.has(badge.id)) ?? null;

  const starsToNextBadge = nextBadge?.level
    ? Math.max(0, nextBadge.level.requiredStars - totalStars)
    : 0;

  return {
    displayBadges,
    unlockedBadgeIds,
    unlockedCount: unlockedBadgeIds.size,
    totalCount: displayBadges.length,
    totalStars,
    currentLevel,
    nextBadge,
    starsToNextBadge,
    hasNoBadgeCatalog: displayBadges.length === 0,
    hasAnyUnlocked: unlockedBadgeIds.size > 0,
  };
}

export function getUnlockedBadgeCount(
  profile: ChildProfile | undefined,
  allAvailableBadges: Badge[] = [],
): number {
  return getAchievementStats(profile, allAvailableBadges).unlockedCount;
}
