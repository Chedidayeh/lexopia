import { z } from "zod";
import type { StoryContentContext } from "./collect-story-context";
import { challengeTypeEnum } from "@/src/lib/challenges/challenge-type-schema";
import { MIN_CHALLENGE_PLACEMENT_CHAPTER } from "./challenge-type-specs";
import { findRepetitiveFieldInChallenge } from "./story-llm-helpers";

export const chapterBlueprintSchema = z.object({
  order: z.number().int().min(1),
  content: z.string().min(1),
});

export const storyChaptersSchema = z.object({
  chapters: z.array(chapterBlueprintSchema).min(1),
});

export const challengeAnswerBlueprintSchema = z.object({
  text: z.string().min(1).max(50),
  isCorrect: z.boolean().optional(),
  order: z.number().int().min(1),
  correctSequence: z.number().int().min(1).optional(),
  letterValue: z.string().max(2).optional(),
});

export const challengeBlueprintSchema = z.object({
  order: z.number().int().min(1),
  type: challengeTypeEnum,
  placementChapterOrder: z.number().int().min(1),
  question: z.string().min(1).max(280),
  targetWord: z.string().max(40).optional(),
  correctAnswerBoolean: z.boolean().optional(),
  sentenceTemplate: z.string().max(180).optional(),
  blankIndex: z.number().int().min(0).optional(),
  answers: z.array(challengeAnswerBlueprintSchema).optional(),
  hints: z.array(z.string().min(1).max(120)).min(2).max(2),
});

export const storyChallengesSchema = z.object({
  challenges: z.array(challengeBlueprintSchema).min(1),
});

export type StoryChaptersBlueprint = z.infer<typeof storyChaptersSchema>;
export type StoryChallengesBlueprint = z.infer<typeof storyChallengesSchema>;
export type ChallengeBlueprint = z.infer<typeof challengeBlueprintSchema>;

export function getRequiredChallengeTypes(
  assignedChallenges: string[],
  count: number,
): string[] {
  if (assignedChallenges.length === 0) {
    return [];
  }

  return Array.from(
    { length: count },
    (_, index) => assignedChallenges[index % assignedChallenges.length],
  );
}

export function resolvePlannedChallengeTypes(
  story: { plannedChallengeTypes: string[]; challengesPerStory: number },
  assignedChallenges: string[],
): string[] {
  if (story.plannedChallengeTypes.length > 0) {
    return story.plannedChallengeTypes;
  }

  return getRequiredChallengeTypes(
    assignedChallenges,
    story.challengesPerStory,
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasSequentialOrders(orders: number[], expectedCount: number): boolean {
  if (orders.length !== expectedCount) {
    return false;
  }

  const sorted = [...orders].sort((a, b) => a - b);
  const expected = Array.from({ length: expectedCount }, (_, index) => index + 1);
  return sorted.join(",") === expected.join(",");
}

function sortByOrderIfSequential<T extends { order: number }>(
  items: T[],
): T[] {
  const orders = items.map((item) => item.order);
  if (hasSequentialOrders(orders, items.length)) {
    return [...items].sort((a, b) => a.order - b.order);
  }

  return [...items];
}

export function normalizeChaptersBlueprint(
  blueprint: StoryChaptersBlueprint,
): StoryChaptersBlueprint {
  const sorted = sortByOrderIfSequential(blueprint.chapters);

  return {
    chapters: sorted.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    })),
  };
}

export function normalizeChallengesBlueprint(
  blueprint: StoryChallengesBlueprint,
  maxChapter?: number,
): StoryChallengesBlueprint {
  const sorted = sortByOrderIfSequential(blueprint.challenges);

  let challenges = sorted.map((challenge, index) =>
    normalizeChallengeByType({
      ...challenge,
      order: index + 1,
      answers: challenge.answers
        ? sortByOrderIfSequential(challenge.answers).map(
            (answer, answerIndex) => ({
              ...answer,
              order: answerIndex + 1,
            }),
          )
        : challenge.answers,
    }),
  );

  if (maxChapter && maxChapter > 0) {
    challenges = normalizePlacementChapterOrders(challenges, maxChapter);
  }

  return { challenges };
}

function isBlankToken(token: string): boolean {
  return token === "___" || /^___[.!?,;:]+$/.test(token);
}

function findBlankIndex(sentenceTemplate: string): number | undefined {
  const tokens = sentenceTemplate.split(/\s+/);
  const index = tokens.findIndex((token) => isBlankToken(token));
  return index >= 0 ? index : undefined;
}

function normalizeLetterAnswers(
  answers: NonNullable<ChallengeBlueprint["answers"]>,
): NonNullable<ChallengeBlueprint["answers"]> {
  return answers.map((answer) => {
    const letter = answer.text.trim().slice(0, 1);
    return {
      ...answer,
      text: letter,
      letterValue: answer.letterValue?.trim().slice(0, 1) ?? letter,
    };
  });
}

function normalizeFourChoiceAnswers(
  answers: NonNullable<ChallengeBlueprint["answers"]>,
): NonNullable<ChallengeBlueprint["answers"]> {
  const normalized = answers.map((answer) => ({
    ...answer,
    isCorrect: answer.isCorrect === true,
  }));

  const correctIndexes = normalized
    .map((answer, index) => (answer.isCorrect ? index : -1))
    .filter((index) => index >= 0);

  if (correctIndexes.length !== 1 && normalized.length > 0) {
    const keepIndex = correctIndexes[0] ?? 0;
    return normalized.map((answer, index) => ({
      ...answer,
      isCorrect: index === keepIndex,
    }));
  }

  return normalized;
}

function normalizeTrueFalseChallenge(
  challenge: ChallengeBlueprint,
): ChallengeBlueprint {
  const answers = challenge.answers ?? [];
  const trueAnswer = answers.find(
    (answer) => answer.text.trim().toLowerCase() === "true",
  );
  const falseAnswer = answers.find(
    (answer) => answer.text.trim().toLowerCase() === "false",
  );

  let correctAnswerBoolean = challenge.correctAnswerBoolean;
  if (correctAnswerBoolean === undefined && trueAnswer?.isCorrect !== undefined) {
    correctAnswerBoolean = trueAnswer.isCorrect;
  }
  if (correctAnswerBoolean === undefined && falseAnswer?.isCorrect !== undefined) {
    correctAnswerBoolean = !falseAnswer.isCorrect;
  }
  if (correctAnswerBoolean === undefined) {
    correctAnswerBoolean = true;
  }

  return {
    ...challenge,
    correctAnswerBoolean,
    answers: [
      { text: "True", isCorrect: correctAnswerBoolean, order: 1 },
      { text: "False", isCorrect: !correctAnswerBoolean, order: 2 },
    ],
  };
}

function normalizeChallengeByType(
  challenge: ChallengeBlueprint,
): ChallengeBlueprint {
  switch (challenge.type) {
    case "TRUE_FALSE":
      return normalizeTrueFalseChallenge(challenge);

    case "READ_ALOUD": {
      const targetWord = challenge.targetWord?.trim().split(/\s+/)[0];
      return {
        ...challenge,
        targetWord,
        answers: undefined,
        correctAnswerBoolean: undefined,
        sentenceTemplate: undefined,
        blankIndex: undefined,
      };
    }

    case "SEQUENCING": {
      const answers = challenge.answers ?? [];
      if (answers.length === 0) {
        return challenge;
      }

      const sorted = [...answers].sort((a, b) => {
        if (a.correctSequence != null && b.correctSequence != null) {
          return a.correctSequence - b.correctSequence;
        }
        return a.order - b.order;
      });

      return {
        ...challenge,
        answers: sorted.map((answer, index) => ({
          ...answer,
          order: index + 1,
          correctSequence: index + 1,
        })),
      };
    }

    case "FILL_BLANK": {
      const sentenceTemplate = challenge.sentenceTemplate?.trim();
      const blankIndex =
        sentenceTemplate !== undefined
          ? findBlankIndex(sentenceTemplate)
          : undefined;

      return {
        ...challenge,
        sentenceTemplate,
        blankIndex: blankIndex ?? challenge.blankIndex,
        answers: challenge.answers
          ? normalizeFourChoiceAnswers(challenge.answers)
          : challenge.answers,
      };
    }

    case "COMPLETE_WORD":
    case "LETTER_DISCRIMINATION":
      return {
        ...challenge,
        answers: challenge.answers
          ? normalizeLetterAnswers(
              normalizeFourChoiceAnswers(challenge.answers),
            )
          : challenge.answers,
      };

    case "MULTIPLE_CHOICE":
    case "SOUND_MATCH":
      return {
        ...challenge,
        answers: challenge.answers
          ? normalizeFourChoiceAnswers(challenge.answers)
          : challenge.answers,
      };

    case "WORD_BUILD":
      return {
        ...challenge,
        answers: challenge.answers
          ? normalizeLetterAnswers(challenge.answers)
          : challenge.answers,
      };

    default:
      return challenge;
  }
}

function normalizePlacementChapterOrders(
  challenges: ChallengeBlueprint[],
  maxChapter: number,
): ChallengeBlueprint[] {
  const used = new Set<number>();
  const minPlacement = Math.min(MIN_CHALLENGE_PLACEMENT_CHAPTER, maxChapter);

  return challenges.map((challenge, index) => {
    let placement = challenge.placementChapterOrder;

    if (
      placement < minPlacement ||
      placement > maxChapter ||
      used.has(placement)
    ) {
      const spreadDenominator = Math.max(1, challenges.length - 1);
      const preferred = Math.min(
        maxChapter,
        minPlacement +
          Math.round(
            (index * (maxChapter - minPlacement)) / spreadDenominator,
          ),
      );
      placement = preferred;
      while (placement <= maxChapter && used.has(placement)) {
        placement += 1;
      }
      if (placement > maxChapter) {
        placement = minPlacement;
        while (placement <= maxChapter && used.has(placement)) {
          placement += 1;
        }
      }
    }

    used.add(placement);
    return {
      ...challenge,
      placementChapterOrder: placement,
    };
  });
}

function countCorrectAnswers(
  answers: NonNullable<ChallengeBlueprint["answers"]>,
): number {
  return answers.filter((answer) => answer.isCorrect === true).length;
}

function validateFourChoiceAnswers(
  challenge: ChallengeBlueprint,
  typeName: string,
): string | null {
  if (!challenge.answers || challenge.answers.length !== 4) {
    return `${typeName} requires exactly 4 answers`;
  }
  if (countCorrectAnswers(challenge.answers) !== 1) {
    return `${typeName} requires exactly one correct answer`;
  }
  return null;
}

function validateLetterAnswers(
  challenge: ChallengeBlueprint,
  typeName: string,
): string | null {
  const baseError = validateFourChoiceAnswers(challenge, typeName);
  if (baseError) return baseError;

  for (const answer of challenge.answers!) {
    if (!answer.letterValue || answer.letterValue.length !== 1) {
      return `${typeName} requires single-character letterValue on every answer`;
    }
    if (answer.text !== answer.letterValue) {
      return `${typeName} requires text to match letterValue for each letter tile`;
    }
  }
  return null;
}

function validateChallengeTypeFields(
  challenge: ChallengeBlueprint,
): string | null {
  switch (challenge.type) {
    case "MULTIPLE_CHOICE":
    case "SOUND_MATCH":
      return validateFourChoiceAnswers(challenge, challenge.type);

    case "LETTER_DISCRIMINATION":
      return validateLetterAnswers(challenge, challenge.type);

    case "TRUE_FALSE": {
      if (challenge.correctAnswerBoolean === undefined) {
        return "TRUE_FALSE requires correctAnswerBoolean";
      }
      if (!challenge.answers || challenge.answers.length !== 2) {
        return "TRUE_FALSE requires exactly 2 answers (True and False)";
      }
      const trueAnswer = challenge.answers.find(
        (answer) => answer.text.toLowerCase() === "true",
      );
      const falseAnswer = challenge.answers.find(
        (answer) => answer.text.toLowerCase() === "false",
      );
      if (!trueAnswer || !falseAnswer) {
        return 'TRUE_FALSE answers must be text "True" and "False"';
      }
      if (trueAnswer.isCorrect !== challenge.correctAnswerBoolean) {
        return "TRUE_FALSE True answer isCorrect must match correctAnswerBoolean";
      }
      if (falseAnswer.isCorrect === trueAnswer.isCorrect) {
        return "TRUE_FALSE True and False must have opposite isCorrect values";
      }
      return null;
    }

    case "SEQUENCING": {
      if (!challenge.answers || challenge.answers.length < 3) {
        return "SEQUENCING requires at least 3 sequence items";
      }
      if (challenge.answers.length > 4) {
        return "SEQUENCING allows at most 4 sequence items";
      }
      const sequences = challenge.answers.map((answer) => answer.correctSequence);
      if (sequences.some((value) => value == null)) {
        return "SEQUENCING requires correctSequence on each answer";
      }
      const expected = Array.from(
        { length: challenge.answers.length },
        (_, i) => i + 1,
      );
      const sorted = [...sequences].sort((a, b) => (a ?? 0) - (b ?? 0));
      if (sorted.join(",") !== expected.join(",")) {
        return "SEQUENCING correctSequence must be unique values 1..N";
      }
      return null;
    }

    case "FILL_BLANK": {
      if (!challenge.sentenceTemplate?.includes("___")) {
        return 'FILL_BLANK sentenceTemplate must contain "___"';
      }
      if (challenge.blankIndex === undefined) {
        return "FILL_BLANK requires blankIndex";
      }
      const tokens = challenge.sentenceTemplate.split(/\s+/);
      const blankIndex = challenge.blankIndex;
      if (
        blankIndex === undefined ||
        blankIndex < 0 ||
        blankIndex >= tokens.length ||
        !isBlankToken(tokens[blankIndex])
      ) {
        return "FILL_BLANK blankIndex must point to the ___ token (0-based word index)";
      }
      const choiceError = validateFourChoiceAnswers(challenge, "FILL_BLANK");
      if (choiceError) return choiceError;
      for (const answer of challenge.answers!) {
        if (answer.text.includes(" ")) {
          return "FILL_BLANK answers must be single words";
        }
      }
      return null;
    }

    case "COMPLETE_WORD": {
      if (!challenge.sentenceTemplate) {
        return "COMPLETE_WORD requires sentenceTemplate with a partial word";
      }
      return validateLetterAnswers(challenge, "COMPLETE_WORD");
    }

    case "READ_ALOUD": {
      if (!challenge.targetWord || challenge.targetWord.includes(" ")) {
        return "READ_ALOUD requires a single-word targetWord";
      }
      if (challenge.answers && challenge.answers.length > 0) {
        return "READ_ALOUD must not include answers";
      }
      return null;
    }

    case "WORD_BUILD": {
      if (!challenge.answers || challenge.answers.length < 4) {
        return "WORD_BUILD requires at least 4 letter tiles";
      }
      const correctTiles = challenge.answers.filter(
        (answer) => answer.isCorrect === true,
      );
      const decoyTiles = challenge.answers.filter(
        (answer) => answer.isCorrect !== true,
      );
      if (correctTiles.length < 3) {
        return "WORD_BUILD requires at least 3 correct letter tiles for the target word";
      }
      if (decoyTiles.length < 2) {
        return "WORD_BUILD requires at least 2 decoy letter tiles";
      }
      for (const answer of challenge.answers) {
        if (!answer.letterValue || answer.letterValue.length !== 1) {
          return "WORD_BUILD requires single-character letterValue on every tile";
        }
        if (answer.text !== answer.letterValue) {
          return "WORD_BUILD requires text to match letterValue on every tile";
        }
      }
      return null;
    }

    default:
      return null;
  }
}

const CHAPTER_WORD_NEAR_MISS_TOLERANCE = 30;

export function isChapterWordCountAcceptable(
  words: number,
  minAllowed: number,
  maxAllowed: number,
  tolerance = CHAPTER_WORD_NEAR_MISS_TOLERANCE,
): boolean {
  return (
    words >= minAllowed - tolerance && words <= maxAllowed + tolerance
  );
}

export function getChapterWordBounds(context: StoryContentContext): {
  targetWordMin: number;
  targetWordMax: number;
  minAllowed: number;
  maxAllowed: number;
} {
  const expectedCount = context.story.chaptersPerStory;
  const { targetWordMin, targetWordMax, wordsPerChapter } = context.sizing;
  const isLongStory = expectedCount >= 30;
  const slackBelow = Math.max(
    15,
    Math.round(wordsPerChapter * (isLongStory ? 0.22 : 0.18)),
  );
  const slackAbove = Math.max(
    20,
    Math.round(wordsPerChapter * (isLongStory ? 0.15 : 0.12)),
  );

  return {
    targetWordMin,
    targetWordMax,
    minAllowed: Math.max(
      50,
      targetWordMin - slackBelow - (isLongStory ? 20 : 0),
    ),
    maxAllowed: targetWordMax + slackAbove + (isLongStory ? 30 : 0),
  };
}

export function validateChaptersBlueprint(
  blueprint: StoryChaptersBlueprint,
  context: StoryContentContext,
): { valid: true } | { valid: false; error: string } {
  const expectedCount = context.story.chaptersPerStory;
  const { targetWordMin, targetWordMax, minAllowed, maxAllowed } =
    getChapterWordBounds(context);

  if (blueprint.chapters.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} chapters, got ${blueprint.chapters.length}`,
    };
  }

  const orders = blueprint.chapters
    .map((chapter) => chapter.order)
    .sort((a, b) => a - b);
  const expectedOrders = Array.from({ length: expectedCount }, (_, i) => i + 1);
  if (orders.join(",") !== expectedOrders.join(",")) {
    return {
      valid: false,
      error: `Chapter orders must be 1..${expectedCount}`,
    };
  }

  for (const chapter of blueprint.chapters) {
    const words = countWords(chapter.content);
    if (
      !isChapterWordCountAcceptable(words, minAllowed, maxAllowed)
    ) {
      const direction =
        words < minAllowed
          ? `Add at least ${minAllowed - words} more words of narrative detail`
          : `Remove at least ${words - maxAllowed} words`;
      return {
        valid: false,
        error: `Chapter ${chapter.order} has ${words} words; must be ${minAllowed}-${maxAllowed} (target ${targetWordMin}-${targetWordMax}). ${direction}.`,
      };
    }
  }

  return { valid: true };
}

export function validateChallengesBatch(
  blueprint: StoryChallengesBlueprint,
  context: StoryContentContext,
  batch: { startOrder: number; expectedTypes: string[] },
): { valid: true } | { valid: false; error: string } {
  const { startOrder, expectedTypes } = batch;
  const maxChapter = context.story.chaptersPerStory;
  const expectedCount = expectedTypes.length;

  if (blueprint.challenges.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} challenges in this batch, got ${blueprint.challenges.length}`,
    };
  }

  const sorted = [...blueprint.challenges].sort((a, b) => a.order - b.order);
  const expectedOrders = Array.from(
    { length: expectedCount },
    (_, index) => startOrder + index,
  );

  if (sorted.map((challenge) => challenge.order).join(",") !== expectedOrders.join(",")) {
    return {
      valid: false,
      error: `Challenge orders must be ${expectedOrders.join(",")}`,
    };
  }

  for (let index = 0; index < expectedTypes.length; index += 1) {
    if (sorted[index]?.type !== expectedTypes[index]) {
      return {
        valid: false,
        error: `Challenge ${startOrder + index} must be type ${expectedTypes[index]}, got ${sorted[index]?.type}`,
      };
    }
  }

  for (const challenge of sorted) {
    if (
      challenge.placementChapterOrder < MIN_CHALLENGE_PLACEMENT_CHAPTER ||
      challenge.placementChapterOrder > maxChapter
    ) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} placementChapterOrder must be ${MIN_CHALLENGE_PLACEMENT_CHAPTER}..${maxChapter}`,
      };
    }

    if (!challenge.hints || challenge.hints.length !== 2) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} must have exactly 2 hints`,
      };
    }

    const repetitiveField = findRepetitiveFieldInChallenge(challenge);
    if (repetitiveField) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} ${repetitiveField} contains repetitive or overly long text`,
      };
    }

    const typeError = validateChallengeTypeFields(challenge);
    if (typeError) {
      return { valid: false, error: typeError };
    }
  }

  return { valid: true };
}

export function validateChallengesBlueprint(
  blueprint: StoryChallengesBlueprint,
  context: StoryContentContext,
): { valid: true } | { valid: false; error: string } {
  const expectedCount = context.story.challengesPerStory;
  const maxChapter = context.story.chaptersPerStory;
  const plannedChallengeTypes = context.plannedChallengeTypes;

  if (plannedChallengeTypes.length === 0) {
    return { valid: false, error: "Story has no planned challenge types" };
  }

  if (blueprint.challenges.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} challenges, got ${blueprint.challenges.length}`,
    };
  }

  if (plannedChallengeTypes.length !== expectedCount) {
    return {
      valid: false,
      error: `Story plannedChallengeTypes length (${plannedChallengeTypes.length}) does not match challengesPerStory (${expectedCount})`,
    };
  }

  const requiredTypes = plannedChallengeTypes;
  const actualTypes = blueprint.challenges
    .sort((a, b) => a.order - b.order)
    .map((challenge) => challenge.type);

  for (let i = 0; i < requiredTypes.length; i += 1) {
    if (actualTypes[i] !== requiredTypes[i]) {
      return {
        valid: false,
        error: `Challenge ${i + 1} must be type ${requiredTypes[i]}, got ${actualTypes[i]}`,
      };
    }
  }

  const orders = blueprint.challenges
    .map((challenge) => challenge.order)
    .sort((a, b) => a - b);
  const expectedOrders = Array.from({ length: expectedCount }, (_, i) => i + 1);
  if (orders.join(",") !== expectedOrders.join(",")) {
    return {
      valid: false,
      error: `Challenge orders must be 1..${expectedCount}`,
    };
  }

  const placementOrders = blueprint.challenges.map(
    (challenge) => challenge.placementChapterOrder,
  );
  if (new Set(placementOrders).size !== placementOrders.length) {
    return {
      valid: false,
      error: "Each challenge must use a unique placementChapterOrder",
    };
  }

  for (const challenge of blueprint.challenges) {
    if (!plannedChallengeTypes.includes(challenge.type)) {
      return {
        valid: false,
        error: `Challenge type ${challenge.type} is not in the story's planned challenge types`,
      };
    }

    if (
      challenge.placementChapterOrder < MIN_CHALLENGE_PLACEMENT_CHAPTER ||
      challenge.placementChapterOrder > maxChapter
    ) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} placementChapterOrder must be ${MIN_CHALLENGE_PLACEMENT_CHAPTER}..${maxChapter} — challenges cannot appear after chapters 1 or 2 (warmup reading only)`,
      };
    }

    if (!challenge.hints || challenge.hints.length !== 2) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} must have exactly 2 hints`,
      };
    }

    const typeError = validateChallengeTypeFields(challenge);
    if (typeError) {
      return { valid: false, error: typeError };
    }

    const repetitiveField = findRepetitiveFieldInChallenge(challenge);
    if (repetitiveField) {
      return {
        valid: false,
        error: `Challenge ${challenge.order} ${repetitiveField} contains repetitive or overly long text`,
      };
    }
  }

  return { valid: true };
}
