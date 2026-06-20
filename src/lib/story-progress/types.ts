import type { ContentStatus } from "@prisma/client";
import type { ChallengeAttempt } from "@readdly/shared-types";

export type StoryReadingProgress = {
  id: string;
  status: ContentStatus;
  currentChapterOrder: number | null;
  totalTimeSpentSeconds: number;
  lastChapterId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type ChallengeAttemptStats = {
  attemptCount: number;
  lastHintsUsed: number;
};

export type StoryChallengeProgress = {
  /** Latest terminal attempt (SOLVED / SKIPPED) per challenge — drives navigation unlock. */
  resolvedAttempts: Record<string, ChallengeAttempt>;
  /** All attempts grouped by challenge — for restoring riddle UI state. */
  attemptStats: Record<string, ChallengeAttemptStats>;
  totalStarsEarned: number;
};
