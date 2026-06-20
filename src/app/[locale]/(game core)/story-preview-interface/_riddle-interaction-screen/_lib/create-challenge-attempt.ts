import { ChallengeAttempt, ChallengeStatus } from "@readdly/shared-types";
import type { ChallengeSubmission } from "./validate-challenge-answer";

function submissionToStoredFields(submission: ChallengeSubmission): {
  textAnswer?: string | null;
  answerId?: string | null;
} {
  switch (submission.kind) {
    case "choice":
      return { answerId: submission.answerId };
    case "order":
      return { textAnswer: JSON.stringify(submission.answerIds) };
    case "text":
      return { textAnswer: submission.value };
    default:
      return {};
  }
}

export function createChallengeAttempt(params: {
  challengeId: string;
  status: ChallengeStatus;
  attemptNumber: number;
  usedHints: number;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  submission?: ChallengeSubmission;
}): ChallengeAttempt {
  const now = new Date();
  const stored = params.submission
    ? submissionToStoredFields(params.submission)
    : {};

  return {
    id: `preview-${Math.random().toString(36).slice(2, 10)}`,
    challengeId: params.challengeId,
    status: params.status,
    attemptNumber: params.attemptNumber,
    usedHints: params.usedHints,
    isCorrect: params.isCorrect,
    timeSpentSeconds: params.timeSpentSeconds,
    createdAt: now,
    textAnswer: stored.textAnswer ?? null,
    answerId: stored.answerId ?? null,
  };
}
