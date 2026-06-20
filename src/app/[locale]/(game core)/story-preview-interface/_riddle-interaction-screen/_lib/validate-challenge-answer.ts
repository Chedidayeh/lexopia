import { ChallengeType } from "@readdly/shared-types";
import { normalizeText } from "./challenge-utils";
import type { ChallengeChoice, ChallengeViewModel } from "./challenge-view-model";

export type ChallengeSubmission =
  | { kind: "choice"; answerId: string }
  | { kind: "order"; answerIds: string[] }
  | { kind: "text"; value: string };

export interface ValidationResult {
  isCorrect: boolean;
  isAlmost: boolean;
}

function isOrderedMatch(
  submittedIds: string[],
  expectedIds: string[],
): boolean {
  if (submittedIds.length !== expectedIds.length) return false;
  return submittedIds.every((id, index) => id === expectedIds[index]);
}

function validateSequencing(
  submission: ChallengeSubmission,
  viewModel: ChallengeViewModel,
  displayedItems: ChallengeChoice[],
): boolean {
  if (submission.kind !== "order") return false;

  const mappedToCorrectSequence = submission.answerIds.map((displayId) => {
    const item = displayedItems.find((entry) => entry.id === displayId);
    if (!item) return -1;
    return viewModel.sequenceItems.findIndex((entry) => entry.id === item.id);
  });

  return mappedToCorrectSequence.every(
    (position, index) => position === index && position !== -1,
  );
}

function validateReadAloud(
  submission: ChallengeSubmission,
  targetWord?: string | null,
): ValidationResult {
  if (submission.kind !== "text" || !targetWord) {
    return { isCorrect: false, isAlmost: false };
  }

  const normalizedSubmission = normalizeText(submission.value);
  const normalizedTarget = normalizeText(targetWord);

  if (!normalizedSubmission || !normalizedTarget) {
    return { isCorrect: false, isAlmost: false };
  }

  if (normalizedSubmission === normalizedTarget) {
    return { isCorrect: true, isAlmost: false };
  }

  const isAlmost =
    normalizedTarget.includes(normalizedSubmission) ||
    normalizedSubmission.includes(normalizedTarget) ||
    levenshteinDistance(normalizedSubmission, normalizedTarget) <= 1;

  return { isCorrect: false, isAlmost };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

export function validateChallengeAnswer(
  viewModel: ChallengeViewModel,
  submission: ChallengeSubmission,
  displayedSequenceItems: ChallengeChoice[],
): ValidationResult {
  switch (viewModel.type) {
    case ChallengeType.MULTIPLE_CHOICE:
    case ChallengeType.TRUE_FALSE:
    case ChallengeType.FILL_BLANK:
    case ChallengeType.LETTER_DISCRIMINATION:
    case ChallengeType.SOUND_MATCH:
    case ChallengeType.COMPLETE_WORD:
      return {
        isCorrect:
          submission.kind === "choice" &&
          submission.answerId === viewModel.correctAnswerId,
        isAlmost: false,
      };

    case ChallengeType.SEQUENCING:
      return {
        isCorrect: validateSequencing(
          submission,
          viewModel,
          displayedSequenceItems,
        ),
        isAlmost: false,
      };

    case ChallengeType.WORD_BUILD:
      return {
        isCorrect:
          submission.kind === "order" &&
          isOrderedMatch(submission.answerIds, viewModel.correctAnswerIds),
        isAlmost: false,
      };

    case ChallengeType.READ_ALOUD:
      return validateReadAloud(submission, viewModel.targetWord);

    default:
      return { isCorrect: false, isAlmost: false };
  }
}
