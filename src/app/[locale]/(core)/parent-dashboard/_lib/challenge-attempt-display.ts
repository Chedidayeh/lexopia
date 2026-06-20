import type {
  AttemptAction,
  Challenge,
  ChallengeAttempt,
} from "@/src/lib/dashboard/types";
import { ChallengeType } from "@/src/types/types";

type ChallengeAnswer = NonNullable<Challenge["answers"]>[number];

export function getLocalizedAnswerText(
  answer: ChallengeAnswer,
  langCode: string,
): string {
  const translation = answer.translations?.find(
    (entry) => entry.languageCode === langCode,
  );
  return translation?.text || answer.text || answer.letterValue || "";
}

function parseStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (
        Array.isArray(parsed) &&
        parsed.every((entry) => typeof entry === "string")
      ) {
        return parsed;
      }
    } catch {
      // not JSON
    }
  }

  return null;
}

export function formatAnswerIdsAsSequence(
  answerIds: string[],
  challenge: Challenge,
  langCode: string,
): string {
  return answerIds
    .map((id, index) => {
      const answer = challenge.answers?.find((entry) => entry.id === id);
      const label = answer ? getLocalizedAnswerText(answer, langCode) : id;
      return `${index + 1}. ${label}`;
    })
    .join(" → ");
}

export type CorrectAnswerLabels = {
  na: string;
  noCorrectAnswer: string;
  trueLabel: string;
  falseLabel: string;
};

export function getCorrectAnswerDisplay(
  challenge: Challenge | null,
  langCode: string,
  labels: CorrectAnswerLabels,
): string {
  if (!challenge) return labels.na;

  if (challenge.type === ChallengeType.TRUE_FALSE) {
    if (challenge.correctAnswerBoolean === true) return labels.trueLabel;
    if (challenge.correctAnswerBoolean === false) return labels.falseLabel;
  }

  if (challenge.type === ChallengeType.READ_ALOUD && challenge.targetWord) {
    return challenge.targetWord;
  }

  const translation = challenge.translations?.find(
    (entry) => entry.languageCode === langCode,
  );
  const sentenceTemplate =
    translation?.sentenceTemplate || challenge.sentenceTemplate;

  if (
    (challenge.type === ChallengeType.FILL_BLANK ||
      challenge.type === ChallengeType.COMPLETE_WORD) &&
    sentenceTemplate
  ) {
    const correctAnswer = challenge.answers?.find((answer) => answer.isCorrect);
    if (correctAnswer) {
      return sentenceTemplate.replace(
        "___",
        getLocalizedAnswerText(correctAnswer, langCode),
      );
    }
  }

  if (challenge.type === ChallengeType.SEQUENCING && challenge.answers?.length) {
    const items = [...challenge.answers]
      .sort(
        (a, b) =>
          (a.correctSequence ?? a.order ?? 0) -
          (b.correctSequence ?? b.order ?? 0),
      )
      .map(
        (answer, index) =>
          `${index + 1}. ${getLocalizedAnswerText(answer, langCode)}`,
      )
      .join(" → ");
    return items || labels.na;
  }

  if (challenge.type === ChallengeType.WORD_BUILD && challenge.answers?.length) {
    const word = [...challenge.answers]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((answer) => getLocalizedAnswerText(answer, langCode))
      .join("");
    return word || labels.noCorrectAnswer;
  }

  const correctAnswer = challenge.answers?.find((answer) => answer.isCorrect);
  return correctAnswer
    ? getLocalizedAnswerText(correctAnswer, langCode)
    : labels.noCorrectAnswer;
}

export function formatAttemptSubmission(
  attempt: ChallengeAttempt,
  challenge: Challenge | null,
  langCode: string,
): string | null {
  if (!challenge) return null;

  if (attempt.actions?.length) {
    for (const action of attempt.actions) {
      const orderIds = parseStringArray(action.submittedOrderJson);
      if (orderIds?.length) {
        return formatAnswerIdsAsSequence(orderIds, challenge, langCode);
      }

      if (action.selectedAnswerText) {
        return action.selectedAnswerText;
      }

      if (action.selectedAnswerId && challenge.answers) {
        const answer = challenge.answers.find(
          (entry) => entry.id === action.selectedAnswerId,
        );
        if (answer) return getLocalizedAnswerText(answer, langCode);
      }

      if (action.answerText) {
        const orderFromText = parseStringArray(action.answerText);
        if (orderFromText?.length) {
          return formatAnswerIdsAsSequence(orderFromText, challenge, langCode);
        }
        return action.answerText;
      }
    }
  }

  const attemptOrderIds = parseStringArray(attempt.submittedAnswerJson);
  if (attemptOrderIds?.length) {
    return formatAnswerIdsAsSequence(attemptOrderIds, challenge, langCode);
  }

  if (attempt.answerId && challenge.answers) {
    const answer = challenge.answers.find(
      (entry) => entry.id === attempt.answerId,
    );
    if (answer) return getLocalizedAnswerText(answer, langCode);
  }

  if (attempt.textAnswer) {
    const orderFromText = parseStringArray(attempt.textAnswer);
    if (
      orderFromText?.length &&
      (challenge.type === ChallengeType.SEQUENCING ||
        challenge.type === ChallengeType.WORD_BUILD)
    ) {
      return formatAnswerIdsAsSequence(orderFromText, challenge, langCode);
    }
    return attempt.textAnswer;
  }

  return null;
}

export function formatActionSubmission(
  action: AttemptAction,
  challenge: Challenge,
  langCode: string,
): string | null {
  const orderIds = parseStringArray(action.submittedOrderJson);
  if (orderIds?.length) {
    return formatAnswerIdsAsSequence(orderIds, challenge, langCode);
  }

  if (action.selectedAnswerText) {
    return action.selectedAnswerText;
  }

  if (action.selectedAnswerId && challenge.answers) {
    const answer = challenge.answers.find(
      (entry) => entry.id === action.selectedAnswerId,
    );
    if (answer) return getLocalizedAnswerText(answer, langCode);
  }

  if (action.answerText) {
    const orderFromText = parseStringArray(action.answerText);
    if (orderFromText?.length) {
      return formatAnswerIdsAsSequence(orderFromText, challenge, langCode);
    }
    return action.answerText;
  }

  return null;
}
