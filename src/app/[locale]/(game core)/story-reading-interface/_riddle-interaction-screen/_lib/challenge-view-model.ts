import { Challenge, ChallengeType } from "@readdly/shared-types";
import { resolveLanguageCode, shuffleArray } from "./challenge-utils";

export interface ChallengeChoice {
  id: string;
  text: string;
  audioUrl?: string | null;
  letterValue?: string | null;
}

export interface ChallengeViewModel {
  id: string;
  type: ChallengeType;
  question: string;
  sentenceTemplate?: string | null;
  targetWord?: string | null;
  choices: ChallengeChoice[];
  sequenceItems: ChallengeChoice[];
  displayedSequenceItems: ChallengeChoice[];
  wordBank: ChallengeChoice[];
  letterTiles: ChallengeChoice[];
  correctAnswerId?: string;
  correctAnswerIds: string[];
  correctLetterIds: string[];
  hints: { text: string }[];
  starsReward: number;
  questionAudioUrl?: string;
  storyImage: string | null;
  storyImageAlt: string;
}

function localizeAnswerText(
  answer: NonNullable<Challenge["answers"]>[number],
  languageCode: string,
): string {
  const translation = answer.translations?.find(
    (entry) => entry.languageCode === languageCode,
  );
  return translation?.text || answer.text || answer.letterValue || "";
}

function mapChoices(
  challenge: Challenge,
  languageCode: string,
): ChallengeChoice[] {
  return (challenge.answers ?? []).map((answer) => ({
    id: answer.id,
    text: localizeAnswerText(answer, languageCode),
    audioUrl: answer.audioUrl,
    letterValue: answer.letterValue,
  }));
}

function getCorrectAnswerIds(challenge: Challenge): string[] {
  if (challenge.type === ChallengeType.SEQUENCING) {
    return [...(challenge.answers ?? [])]
      .sort(
        (a, b) =>
          (a.correctSequence ?? a.order ?? 0) -
          (b.correctSequence ?? b.order ?? 0),
      )
      .map((answer) => answer.id);
  }

  if (challenge.type === ChallengeType.WORD_BUILD) {
    return [...(challenge.answers ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((answer) => answer.id);
  }

  if (
    challenge.type === ChallengeType.TRUE_FALSE &&
    challenge.correctAnswerBoolean != null
  ) {
    const targetLabel = challenge.correctAnswerBoolean ? "true" : "false";
    const correct =
      challenge.answers?.find((answer) => answer.isCorrect) ||
      challenge.answers?.find(
        (answer) =>
          (answer.text || "").toLowerCase().trim() === targetLabel,
      );
    return correct ? [correct.id] : [];
  }

  const correct = challenge.answers?.find((answer) => answer.isCorrect);
  return correct ? [correct.id] : [];
}

export function transformChallengeToViewModel(
  challenge: Challenge,
  storyImageAlt: string,
  locale?: string,
): ChallengeViewModel {
  const languageCode = resolveLanguageCode(locale);
  const challengeTranslation = challenge.translations?.find(
    (entry) => entry.languageCode === languageCode,
  );
  const choices = mapChoices(challenge, languageCode);
  const correctAnswerIds = getCorrectAnswerIds(challenge);

  const sequenceItems =
    challenge.type === ChallengeType.SEQUENCING
      ? [...(challenge.answers ?? [])]
          .sort(
            (a, b) =>
              (a.correctSequence ?? a.order ?? 0) -
              (b.correctSequence ?? b.order ?? 0),
          )
          .map((answer) => ({
            id: answer.id,
            text: localizeAnswerText(answer, languageCode),
            audioUrl: answer.audioUrl,
            letterValue: answer.letterValue,
          }))
      : [];

  const hintsArray =
    challengeTranslation?.hints ||
    challenge.hints?.map((hint) => hint.text || "").filter(Boolean) ||
    [];

  return {
    id: challenge.id,
    type: challenge.type as ChallengeType,
    question: challengeTranslation?.question || challenge.question || "",
    sentenceTemplate:
      challengeTranslation?.sentenceTemplate || challenge.sentenceTemplate,
    targetWord: challenge.targetWord,
    choices,
    sequenceItems,
    displayedSequenceItems:
      challenge.type === ChallengeType.SEQUENCING
        ? shuffleArray(sequenceItems)
        : [],
    wordBank:
      challenge.type === ChallengeType.FILL_BLANK ? shuffleArray(choices) : [],
    letterTiles:
      challenge.type === ChallengeType.COMPLETE_WORD ||
      challenge.type === ChallengeType.LETTER_DISCRIMINATION ||
      challenge.type === ChallengeType.WORD_BUILD
        ? shuffleArray(choices)
        : [],
    correctAnswerId: correctAnswerIds[0],
    correctAnswerIds,
    correctLetterIds: correctAnswerIds,
    hints: hintsArray.map((hint) => ({
      text: typeof hint === "string" ? hint : String(hint),
    })),
    starsReward: challenge.baseStars ?? 20,
    questionAudioUrl:
      challengeTranslation?.audioUrl || challenge.audioUrl || undefined,
    storyImage: challenge.imageUrl ?? null,
    storyImageAlt,
  };
}
