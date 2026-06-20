import {
  ChallengeAttempt,
  ChallengeStatus,
  Local,
  Story,
} from "@readdly/shared-types";
import {
  getChapterByPageNumber,
  type StoryPage,
} from "../_components/storyDataTransform";

export type LocalizedStoryPage = StoryPage & {
  audioUrl?: string;
  chapterId: string;
  challengeId?: string;
};

export function resolveLanguageCode(locale?: string): string {
  return (locale || Local.EN).split("-")[0].toUpperCase();
}

export function buildLocalizedPages(
  story: Story,
  locale?: string,
): LocalizedStoryPage[] {
  const langCode = resolveLanguageCode(locale);
  if (!story.chapters?.length) return [];

  const sortedChapters = [...story.chapters].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return sortedChapters.map((chapter, index) => {
    const translation = chapter.translations?.find(
      (entry) => entry.languageCode === langCode,
    );

    return {
      pageNumber: index + 1,
      text: translation?.content || chapter.content || "",
      audioUrl: translation?.audioUrl || chapter.audioUrl,
      image: chapter.imageUrl ?? null,
      alt: `Page ${index + 1}`,
      hasRiddle: !!chapter.challenge,
      chapterId: chapter.id,
      challengeId: chapter.challenge?.id,
    };
  });
}

export function getLocalizedStoryTitle(story: Story, locale?: string): string {
  const langCode = resolveLanguageCode(locale);
  const translation = story.translations?.find(
    (entry) => entry.languageCode === langCode,
  );
  return translation?.title || story.title;
}

export function findChallengeInStory(
  story: Story,
  challengeId: string,
) {
  for (const chapter of story.chapters ?? []) {
    if (chapter.challenge?.id === challengeId) {
      return chapter.challenge;
    }
  }
  return story.challenges?.find((challenge) => challenge.id === challengeId);
}

export function canProceedFromChallengePage(
  hasChallenge: boolean,
  attempt?: ChallengeAttempt,
): boolean {
  if (!hasChallenge) return true;
  if (!attempt) return false;

  return (
    attempt.status === ChallengeStatus.SOLVED ||
    attempt.status === ChallengeStatus.SKIPPED ||
    attempt.isCorrect === true
  );
}

export function getNavigationChallengeState(
  hasChallenge: boolean,
  challengeId: string | undefined,
  attempt?: ChallengeAttempt,
): ChallengeAttempt | undefined {
  if (!hasChallenge || !challengeId) return undefined;

  if (canProceedFromChallengePage(true, attempt)) {
    return attempt;
  }

  return {
    id: "pending",
    challengeId,
    attemptNumber: attempt?.attemptNumber ?? 0,
    status: ChallengeStatus.NOT_ATTEMPTED,
    timeSpentSeconds: attempt?.timeSpentSeconds ?? 0,
    usedHints: attempt?.usedHints ?? 0,
    createdAt: attempt?.createdAt ?? new Date().toISOString(),
    isCorrect: attempt?.isCorrect ?? null,
  };
}

export function computeStarsEarned(
  attempts: Record<string, ChallengeAttempt>,
  story: Story,
): number {
  let total = 0;

  for (const [challengeId, attempt] of Object.entries(attempts)) {
    const solved =
      attempt.status === ChallengeStatus.SOLVED || attempt.isCorrect === true;
    if (!solved) continue;

    const challenge = findChallengeInStory(story, challengeId);
    total += challenge?.baseStars ?? 0;
  }

  return total;
}

export function getChapterForPage(story: Story, pageNumber: number) {
  return getChapterByPageNumber(story, pageNumber);
}
