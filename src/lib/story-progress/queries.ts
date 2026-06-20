import { prisma } from "@/src/lib/prisma";
import { RoleType } from "@/src/types/types";
import { mapDbChallengeAttemptToClient } from "./map-challenge-attempt";
import type {
  StoryChallengeProgress,
  StoryReadingProgress,
} from "./types";

export async function assertChildBelongsToUser(
  childId: string,
  userId: string,
  role: string,
): Promise<{ parentId: string; sessionDurationMins: number } | null> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true, sessionDurationMins: true },
  });

  if (!child) return null;

  if (role !== RoleType.ADMIN && child.parentId !== userId) {
    return null;
  }

  return child;
}

export async function isStoryAccessibleForChild(
  storyId: string,
  childId: string,
): Promise<boolean> {
  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      world: {
        roadmap: {
          childId,
        },
      },
    },
    select: { id: true },
  });

  return !!story;
}

export async function getChildStoryReadingProgress(
  childId: string,
  storyId: string,
): Promise<StoryReadingProgress | null> {
  const progress = await prisma.childStoryProgress.findUnique({
    where: { childId_storyId: { childId, storyId } },
    include: {
      gameSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { chapterId: true },
      },
    },
  });

  if (!progress) return null;

  return {
    id: progress.id,
    status: progress.status,
    currentChapterOrder: progress.currentChapterOrder,
    totalTimeSpentSeconds: progress.totalTimeSpentSeconds,
    lastChapterId: progress.gameSessions[0]?.chapterId ?? null,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
  };
}

export function resolveInitialStoryPage(
  progress: StoryReadingProgress | null,
  totalChapters: number,
): number {
  if (totalChapters <= 0) return 1;

  if (
    progress?.status === "IN_PROGRESS" &&
    progress.currentChapterOrder != null &&
    progress.currentChapterOrder >= 1
  ) {
    return Math.min(progress.currentChapterOrder, totalChapters);
  }

  return 1;
}

/** Bookmark never moves backward — only advances when the child reaches a new high page. */
export function resolveStoryCheckpoint(
  existing: number | null | undefined,
  requested: number,
): number {
  return Math.max(existing ?? 1, requested);
}

export async function getChildStoryChallengeProgress(
  childId: string,
  storyId: string,
): Promise<StoryChallengeProgress> {
  const attempts = await prisma.challengeAttempt.findMany({
    where: {
      challenge: { storyId },
      gameSession: {
        childStoryProgress: { childId, storyId },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const starEvents = await prisma.starEvent.findMany({
    where: {
      attempt: {
        challenge: { storyId },
        gameSession: {
          childStoryProgress: { childId, storyId },
        },
      },
    },
    select: { totalStars: true },
  });

  const resolvedAttempts: StoryChallengeProgress["resolvedAttempts"] = {};
  const attemptStats: StoryChallengeProgress["attemptStats"] = {};

  for (const attempt of attempts) {
    const clientAttempt = mapDbChallengeAttemptToClient(attempt);

    attemptStats[attempt.challengeId] = {
      attemptCount: (attemptStats[attempt.challengeId]?.attemptCount ?? 0) + 1,
      lastHintsUsed: attempt.hintsUsed,
    };

    if (attempt.status === "SOLVED" || attempt.status === "SKIPPED") {
      resolvedAttempts[attempt.challengeId] = clientAttempt;
    }
  }

  const totalStarsEarned = starEvents.reduce(
    (sum, event) => sum + event.totalStars,
    0,
  );

  return {
    resolvedAttempts,
    attemptStats,
    totalStarsEarned,
  };
}
