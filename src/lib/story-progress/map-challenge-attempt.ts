import type { ChallengeAttempt as PrismaChallengeAttempt } from "@prisma/client";
import type { ChallengeAttempt } from "@readdly/shared-types";
import type { ChallengeStatus } from "@/src/types/types";

type DbChallengeAttempt = PrismaChallengeAttempt;

export function mapDbChallengeAttemptToClient(
  attempt: DbChallengeAttempt,
): ChallengeAttempt {
  let textAnswer = attempt.textAnswer;
  if (!textAnswer && attempt.submittedAnswerJson) {
    textAnswer = JSON.stringify(attempt.submittedAnswerJson);
  }

  return {
    id: attempt.id,
    challengeId: attempt.challengeId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status as ChallengeStatus,
    isCorrect: attempt.isCorrect,
    timeSpentSeconds: attempt.timeSpentSeconds,
    usedHints: attempt.hintsUsed,
    createdAt: attempt.createdAt.toISOString(),
    answerId: attempt.answerId,
    textAnswer,
  };
}

export function parseAttemptPayloadForDb(attempt: ChallengeAttempt): {
  answerId: string | null;
  textAnswer: string | null;
  submittedAnswerJson: unknown;
  speechAccuracy: number | null;
} {
  const answerId = attempt.answerId ?? null;
  let textAnswer = attempt.textAnswer ?? null;
  let submittedAnswerJson: unknown = null;

  if (textAnswer?.startsWith("[")) {
    try {
      submittedAnswerJson = JSON.parse(textAnswer);
      textAnswer = null;
    } catch {
      // keep as textAnswer
    }
  }

  return {
    answerId,
    textAnswer,
    submittedAnswerJson,
    speechAccuracy: null,
  };
}
