"use server";

import { AgentTrigger } from "@prisma/client";
import { auth } from "@/src/auth";
import { requestChildOrchestration } from "@/src/lib/orchestration/request-orchestration";
import { prisma } from "@/src/lib/prisma";
import type { ChallengeStatus } from "@/src/types/types";
import {
  assertChildBelongsToUser,
  isStoryAccessibleForChild,
  resolveStoryCheckpoint,
} from "./queries";

async function syncGameSessionCheckpointChapter(
  gameSessionId: string,
  storyId: string,
  previousCheckpoint: number | null,
  nextCheckpoint: number,
) {
  if (nextCheckpoint <= (previousCheckpoint ?? 1)) {
    return;
  }

  const chapter = await prisma.chapter.findFirst({
    where: { storyId, order: nextCheckpoint },
    select: { id: true },
  });

  if (!chapter) return;

  await prisma.gameSession.update({
    where: { id: gameSessionId },
    data: { chapterId: chapter.id },
  });
}

async function assertChildStoryAccess(
  childId: string,
  storyId: string,
  userId: string,
  role: string,
) {
  const child = await assertChildBelongsToUser(childId, userId, role);
  if (!child) return null;

  const accessible = await isStoryAccessibleForChild(storyId, childId);
  if (!accessible) return null;

  return { childId };
}

async function getOrCreateGameSession(childId: string, storyId: string) {
  let progress = await prisma.childStoryProgress.findUnique({
    where: { childId_storyId: { childId, storyId } },
    include: {
      gameSessions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!progress) {
    progress = await prisma.childStoryProgress.create({
      data: {
        childId,
        storyId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        currentChapterOrder: 1,
      },
      include: {
        gameSessions: true,
      },
    });
  } else if (
    progress.status === "AVAILABLE" ||
    progress.status === "LOCKED"
  ) {
    progress = await prisma.childStoryProgress.update({
      where: { id: progress.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: progress.startedAt ?? new Date(),
      },
      include: {
        gameSessions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
  }

  let session = progress.gameSessions[0];
  if (!session || session.endedAt) {
    session = await prisma.gameSession.create({
      data: {
        childStoryProgressId: progress.id,
        storyId,
      },
    });
  }

  return { progress, session };
}

async function recordSessionTimeCheckpoint(
  gameSessionId: string,
  chapterId: string,
  timeSpentSeconds: number,
) {
  if (timeSpentSeconds <= 0) return;

  const pausedAt = new Date();
  const startedAt = new Date(pausedAt.getTime() - timeSpentSeconds * 1000);

  await prisma.$transaction([
    prisma.sessionCheckpoint.create({
      data: {
        gameSessionId,
        firstChapterId: chapterId,
        lastChapterId: chapterId,
        startedAt,
        pausedAt,
        sessionDurationSeconds: timeSpentSeconds,
      },
    }),
    prisma.gameSession.update({
      where: { id: gameSessionId },
      data: {
        elapsedTimeSeconds: { increment: timeSpentSeconds },
        sessionCount: { increment: 1 },
      },
    }),
  ]);
}

async function syncChildDailyActivity(childId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.childDailyActivity.findUnique({
    where: { childId },
  });

  if (!existing) {
    await prisma.childDailyActivity.create({
      data: {
        childId,
        lastActiveAt: now,
        currentStreak: 1,
        longestStreak: 1,
      },
    });
    return;
  }

  let currentStreak = existing.currentStreak;

  if (existing.lastActiveAt) {
    const lastActive = new Date(existing.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);
    const gapDays = Math.round(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (gapDays === 0) {
      currentStreak = existing.currentStreak;
    } else if (gapDays === 1) {
      currentStreak = existing.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  await prisma.childDailyActivity.update({
    where: { childId },
    data: {
      lastActiveAt: now,
      currentStreak,
      longestStreak: Math.max(existing.longestStreak, currentStreak),
    },
  });
}

async function persistReadingTimeSegment(input: {
  childId: string;
  gameSessionId: string;
  chapterId: string;
  timeSpentSeconds?: number;
}) {
  const timeSpent = input.timeSpentSeconds ?? 0;
  if (timeSpent <= 0) return;

  await recordSessionTimeCheckpoint(
    input.gameSessionId,
    input.chapterId,
    timeSpent,
  );
  await syncChildDailyActivity(input.childId);
}

export async function saveStoryBookmarkAction(input: {
  childId: string;
  storyId: string;
  chapterId: string;
  chapterOrder: number;
  timeSpentSeconds?: number;
}): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const access = await assertChildStoryAccess(
    input.childId,
    input.storyId,
    session.user.id,
    session.user.role,
  );
  if (!access) return { success: false };

  const { progress, session: gameSession } = await getOrCreateGameSession(
    input.childId,
    input.storyId,
  );

  const timeSpent = input.timeSpentSeconds ?? 0;
  const nextCheckpoint = resolveStoryCheckpoint(
    progress.currentChapterOrder,
    input.chapterOrder,
  );

  await prisma.childChapterProgress.upsert({
    where: {
      childId_chapterId: {
        childId: input.childId,
        chapterId: input.chapterId,
      },
    },
    create: {
      childId: input.childId,
      chapterId: input.chapterId,
      status: "IN_PROGRESS",
      timeSpentSeconds: timeSpent,
      startedAt: new Date(),
    },
    update: {
      status: "IN_PROGRESS",
      timeSpentSeconds: { increment: timeSpent },
    },
  });

  await prisma.childStoryProgress.update({
    where: { id: progress.id },
    data: {
      currentChapterOrder: nextCheckpoint,
      totalTimeSpentSeconds: { increment: timeSpent },
    },
  });

  await syncGameSessionCheckpointChapter(
    gameSession.id,
    input.storyId,
    progress.currentChapterOrder,
    nextCheckpoint,
  );

  await persistReadingTimeSegment({
    childId: input.childId,
    gameSessionId: gameSession.id,
    chapterId: input.chapterId,
    timeSpentSeconds: timeSpent,
  });

  return { success: true };
}

export async function recordChapterProgressAction(input: {
  childId: string;
  storyId: string;
  chapterId: string;
  chapterOrder: number;
  timeSpentSeconds?: number;
  wordHelpCount?: number;
  ttsReplayCount?: number;
}): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const access = await assertChildStoryAccess(
    input.childId,
    input.storyId,
    session.user.id,
    session.user.role,
  );
  if (!access) return { success: false };

  const { progress, session: gameSession } = await getOrCreateGameSession(
    input.childId,
    input.storyId,
  );

  await prisma.childChapterProgress.upsert({
    where: {
      childId_chapterId: {
        childId: input.childId,
        chapterId: input.chapterId,
      },
    },
    create: {
      childId: input.childId,
      chapterId: input.chapterId,
      status: "COMPLETED",
      timeSpentSeconds: input.timeSpentSeconds ?? 0,
      wordHelpCount: input.wordHelpCount ?? 0,
      ttsReplayCount: input.ttsReplayCount ?? 0,
      startedAt: new Date(),
      completedAt: new Date(),
    },
    update: {
      status: "COMPLETED",
      timeSpentSeconds: { increment: input.timeSpentSeconds ?? 0 },
      wordHelpCount: { increment: input.wordHelpCount ?? 0 },
      ttsReplayCount: { increment: input.ttsReplayCount ?? 0 },
      completedAt: new Date(),
    },
  });

  await prisma.chapterReadingMetric.upsert({
    where: {
      gameSessionId_chapterId: {
        gameSessionId: gameSession.id,
        chapterId: input.chapterId,
      },
    },
    create: {
      gameSessionId: gameSession.id,
      chapterId: input.chapterId,
      timeSpentSeconds: input.timeSpentSeconds ?? 0,
    },
    update: {
      timeSpentSeconds: { increment: input.timeSpentSeconds ?? 0 },
    },
  });

  const nextCheckpoint = resolveStoryCheckpoint(
    progress.currentChapterOrder,
    input.chapterOrder,
  );

  await prisma.childStoryProgress.update({
    where: { id: progress.id },
    data: {
      currentChapterOrder: nextCheckpoint,
      totalTimeSpentSeconds: {
        increment: input.timeSpentSeconds ?? 0,
      },
    },
  });

  await syncGameSessionCheckpointChapter(
    gameSession.id,
    input.storyId,
    progress.currentChapterOrder,
    nextCheckpoint,
  );

  await persistReadingTimeSegment({
    childId: input.childId,
    gameSessionId: gameSession.id,
    chapterId: input.chapterId,
    timeSpentSeconds: input.timeSpentSeconds,
  });

  return { success: true };
}

export async function recordChallengeAttemptAction(input: {
  childId: string;
  storyId: string;
  challengeId: string;
  status: ChallengeStatus;
  attemptNumber: number;
  hintsUsed: number;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  answerId?: string | null;
  textAnswer?: string | null;
  submittedAnswerJson?: unknown;
  speechAccuracy?: number | null;
}): Promise<{ success: boolean; attemptId?: string; starsEarned?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const access = await assertChildStoryAccess(
    input.childId,
    input.storyId,
    session.user.id,
    session.user.role,
  );
  if (!access) return { success: false };

  const { session: gameSession } = await getOrCreateGameSession(
    input.childId,
    input.storyId,
  );

  const challenge = await prisma.challenge.findFirst({
    where: { id: input.challengeId, storyId: input.storyId },
    select: { id: true, baseStars: true },
  });

  if (!challenge) return { success: false };

  let submittedAnswerJson = input.submittedAnswerJson ?? null;
  let textAnswer = input.textAnswer ?? null;

  if (!submittedAnswerJson && textAnswer?.startsWith("[")) {
    try {
      submittedAnswerJson = JSON.parse(textAnswer);
      textAnswer = null;
    } catch {
      // keep textAnswer
    }
  }

  let selectedAnswerText: string | null = null;
  if (input.answerId) {
    const answer = await prisma.answer.findUnique({
      where: { id: input.answerId },
      select: { text: true, letterValue: true },
    });
    if (answer) {
      selectedAnswerText = answer.text || answer.letterValue || null;
    }
  }

  const attempt = await prisma.challengeAttempt.create({
    data: {
      gameSessionId: gameSession.id,
      challengeId: input.challengeId,
      status: input.status,
      attemptNumber: input.attemptNumber,
      hintsUsed: input.hintsUsed,
      isCorrect: input.isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
      answerId: input.answerId,
      textAnswer,
      submittedAnswerJson:
        submittedAnswerJson === null ? undefined : submittedAnswerJson,
      speechAccuracy: input.speechAccuracy,
    },
  });

  await prisma.attemptAction.create({
    data: {
      attemptId: attempt.id,
      selectedAnswerId: input.answerId ?? null,
      selectedAnswerText,
      answerText: textAnswer,
      submittedOrderJson:
        submittedAnswerJson === null ? undefined : submittedAnswerJson,
      isCorrect: input.isCorrect,
      attemptNumberAtAction: input.attemptNumber,
    },
  });

  let starsEarned = 0;

  if (input.status === "SOLVED" && input.isCorrect === true) {
    const priorSolved = await prisma.challengeAttempt.findFirst({
      where: {
        id: { not: attempt.id },
        challengeId: input.challengeId,
        status: "SOLVED",
        gameSession: {
          childStoryProgress: {
            childId: input.childId,
            storyId: input.storyId,
          },
        },
      },
      select: { id: true },
    });

    if (!priorSolved) {
      const noHintBonus =
        input.hintsUsed === 0 ? Math.round(challenge.baseStars * 0.25) : 0;
      const firstTryBonus =
        input.attemptNumber === 1 ? Math.round(challenge.baseStars * 0.25) : 0;
      const totalStars = challenge.baseStars + noHintBonus + firstTryBonus;

      await prisma.starEvent.create({
        data: {
          attemptId: attempt.id,
          challengeId: input.challengeId,
          baseStars: challenge.baseStars,
          noHintBonus,
          firstTryBonus,
          totalStars,
          attemptNumber: input.attemptNumber,
          usedHints: input.hintsUsed > 0,
          wasCorrect: true,
        },
      });

      await prisma.child.update({
        where: { id: input.childId },
        data: { totalStars: { increment: totalStars } },
      });

      await prisma.gameSession.update({
        where: { id: gameSession.id },
        data: { starsEarned: { increment: totalStars } },
      });

      starsEarned = totalStars;
    }
  }

  return { success: true, attemptId: attempt.id, starsEarned };
}

export async function completeStoryAction(input: {
  childId: string;
  storyId: string;
}): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  const access = await assertChildStoryAccess(
    input.childId,
    input.storyId,
    session.user.id,
    session.user.role,
  );
  if (!access) return { success: false };

  const progress = await prisma.childStoryProgress.update({
    where: {
      childId_storyId: {
        childId: input.childId,
        storyId: input.storyId,
      },
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await prisma.gameSession.updateMany({
    where: {
      childStoryProgressId: progress.id,
      endedAt: null,
    },
    data: { endedAt: new Date() },
  });

  try {
    await requestChildOrchestration(
      input.childId,
      AgentTrigger.STORY_UNLOCK,
    );
  } catch (error) {
    console.error("Failed to request post-completion orchestration:", error);
  }

  return { success: true };
}
