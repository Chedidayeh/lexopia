import type { ReadingLevel } from "@/src/types/types";
import type { ReadingPlanConfiguration } from "@/src/lib/onboarding/plan-constraints";

type SessionDuration = 10 | 20 | 30 | 60;

const MIN_WORDS_PER_CHAPTER = 250;

const CHAPTERS_BY_DURATION: Record<SessionDuration, number> = {
  10: 10,
  20: 20,
  30: 30,
  60: 60,
};

const WORDS_BY_DURATION: Record<SessionDuration, number> = {
  10: MIN_WORDS_PER_CHAPTER,
  20: MIN_WORDS_PER_CHAPTER,
  30: MIN_WORDS_PER_CHAPTER,
  60: MIN_WORDS_PER_CHAPTER,
};

const MAX_CHALLENGES_PER_STORY = 10;

const LEVEL_ADJUSTMENTS: Record<
  ReadingLevel,
  { wordsMultiplier: number }
> = {
  BEGINNER: { wordsMultiplier: 0.75 },
  EASY: { wordsMultiplier: 0.9 },
  MEDIUM: { wordsMultiplier: 1 },
  HARD: { wordsMultiplier: 1.1 },
  ADVANCED: { wordsMultiplier: 1.2 },
};

export type StorySizing = {
  chaptersPerStory: number;
  wordsPerChapter: number;
  targetWordMin: number;
  targetWordMax: number;
  challengesPerStory: number;
};

export function deriveStorySizing(
  sessionDurationMins: number,
  readingLevel: ReadingLevel,
  readingPlanConfiguration?: ReadingPlanConfiguration,
): StorySizing {
  const duration = normalizeSessionDuration(sessionDurationMins);
  const adjustment = LEVEL_ADJUSTMENTS[readingLevel];

  const chaptersPerStory = Math.min(
    CHAPTERS_BY_DURATION[duration],
    readingPlanConfiguration?.maxChaptersPerStoryAllowed ?? CHAPTERS_BY_DURATION[duration],
  );
  const wordsPerChapter = Math.round(
    WORDS_BY_DURATION[duration] * adjustment.wordsMultiplier,
  );
  const range = Math.max(10, Math.round(wordsPerChapter * 0.07));
  const challengesPerStory = Math.min(
    MAX_CHALLENGES_PER_STORY,
    (duration / 10) * 2,
    readingPlanConfiguration?.maxChallengeTypes ?? MAX_CHALLENGES_PER_STORY,
  );

  return {
    chaptersPerStory,
    wordsPerChapter,
    targetWordMin: wordsPerChapter - range,
    targetWordMax: wordsPerChapter + range,
    challengesPerStory,
  };
}

export function getStorySizingForPlan(
  sessionDurationMins: number,
  readingLevel: ReadingLevel,
  readingPlanConfiguration?: ReadingPlanConfiguration,
): StorySizing {
  return deriveStorySizing(sessionDurationMins, readingLevel, readingPlanConfiguration);
}

function normalizeSessionDuration(mins: number): SessionDuration {
  if (mins <= 10) return 10;
  if (mins <= 20) return 20;
  if (mins <= 30) return 30;
  return 60;
}
