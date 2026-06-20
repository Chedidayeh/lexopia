"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChallengeAttempt,
  Story,
} from "@readdly/shared-types";
import {
  buildLocalizedPages,
  computeStarsEarned,
  getChapterForPage,
  getLocalizedStoryTitle,
  getNavigationChallengeState,
} from "./story-reading-session";
import {
  recordChapterProgressAction,
  recordChallengeAttemptAction,
  completeStoryAction,
} from "@/src/lib/story-progress/server-actions";
import type { ChallengeStatus } from "@/src/types/types";

export function useStoryReadingSession(
  story: Story,
  locale?: string,
  childId?: string,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showRiddle, setShowRiddle] = useState(false);
  const [localChallengeAttempts, setLocalChallengeAttempts] = useState<
    Record<string, ChallengeAttempt>
  >({});

  const chapterTelemetryRef = useRef({ wordHelpCount: 0, ttsReplayCount: 0 });

  const localizedPages = useMemo(
    () => buildLocalizedPages(story, locale),
    [story, locale],
  );

  const localizedTitle = useMemo(
    () => getLocalizedStoryTitle(story, locale),
    [story, locale],
  );

  const currentPageData = localizedPages[currentPage - 1];
  const currentChapter = useMemo(
    () => getChapterForPage(story, currentPage),
    [story, currentPage],
  );
  const currentChallenge = currentChapter?.challenge ?? null;

  const currentChallengeAttempt = useMemo(() => {
    if (!currentChallenge) return undefined;
    return localChallengeAttempts[currentChallenge.id];
  }, [currentChallenge, localChallengeAttempts]);

  const navigationChallengeState = useMemo(
    () =>
      getNavigationChallengeState(
        !!currentPageData?.hasRiddle,
        currentChallenge?.id,
        currentChallengeAttempt,
      ),
    [
      currentPageData?.hasRiddle,
      currentChallenge?.id,
      currentChallengeAttempt,
    ],
  );

  const totalStarsEarned = useMemo(
    () => computeStarsEarned(localChallengeAttempts, story),
    [localChallengeAttempts, story],
  );

  const recordTtsReplay = useCallback(() => {
    chapterTelemetryRef.current.ttsReplayCount += 1;
  }, []);

  const recordWordHelp = useCallback(() => {
    chapterTelemetryRef.current.wordHelpCount += 1;
  }, []);

  const persistChapter = useCallback(
    async (page: number) => {
      if (!childId) return;
      const chapter = getChapterForPage(story, page);
      if (!chapter?.id) return;

      const { wordHelpCount, ttsReplayCount } = chapterTelemetryRef.current;

      await recordChapterProgressAction({
        childId,
        storyId: story.id,
        chapterId: chapter.id,
        chapterOrder: page,
        wordHelpCount,
        ttsReplayCount,
      });

      chapterTelemetryRef.current = { wordHelpCount: 0, ttsReplayCount: 0 };
    },
    [childId, story],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      void persistChapter(currentPage);
      setCurrentPage(page);
      setShowRiddle(false);
    },
    [currentPage, persistChapter],
  );

  const handleChallengeSubmitted = useCallback(
    (updatedAttempt: ChallengeAttempt) => {
      setLocalChallengeAttempts((prev) => ({
        ...prev,
        [updatedAttempt.challengeId]: updatedAttempt,
      }));

      if (!childId) return;

      void recordChallengeAttemptAction({
        childId,
        storyId: story.id,
        challengeId: updatedAttempt.challengeId,
        status: updatedAttempt.status as ChallengeStatus,
        attemptNumber: updatedAttempt.attemptNumber,
        hintsUsed: updatedAttempt.usedHints ?? 0,
        isCorrect: updatedAttempt.isCorrect ?? null,
        timeSpentSeconds: updatedAttempt.timeSpentSeconds ?? 0,
        answerId: updatedAttempt.answerId,
        textAnswer: updatedAttempt.textAnswer,
      });
    },
    [childId, story.id],
  );

  const handleStoryComplete = useCallback(async () => {
    if (!childId) return;
    await persistChapter(currentPage);
    await completeStoryAction({ childId, storyId: story.id });
  }, [childId, currentPage, persistChapter, story.id]);

  return {
    currentPage,
    showRiddle,
    setShowRiddle,
    localizedPages,
    localizedTitle,
    currentPageData,
    currentChapter,
    currentChallenge,
    currentChallengeAttempt,
    navigationChallengeState,
    totalStarsEarned,
    handlePageChange,
    handleChallengeSubmitted,
    handleStoryComplete,
    recordTtsReplay,
    recordWordHelp,
  };
}
