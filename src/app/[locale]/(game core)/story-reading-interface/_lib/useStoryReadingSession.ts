"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChallengeAttempt,
  Story,
} from "@readdly/shared-types";
import {
  buildLocalizedPages,
  getChapterForPage,
  getLocalizedStoryTitle,
  getNavigationChallengeState,
} from "./story-reading-session";
import {
  recordChapterProgressAction,
  recordChallengeAttemptAction,
  completeStoryAction,
  saveStoryBookmarkAction,
} from "@/src/lib/story-progress/server-actions";
import type { ChallengeStatus } from "@/src/types/types";
import type { StoryChallengeProgress, StoryReadingProgress } from "@/src/lib/story-progress/types";
import { parseAttemptPayloadForDb } from "@/src/lib/story-progress/map-challenge-attempt";

export type StoryReadingSessionOptions = {
  childId: string;
  initialPage: number;
  sessionDurationMins: number;
  storyProgress: StoryReadingProgress | null;
  challengeProgress: StoryChallengeProgress;
};

export function useStoryReadingSession(
  story: Story,
  locale: string | undefined,
  options: StoryReadingSessionOptions,
) {
  const { childId, initialPage, sessionDurationMins, storyProgress, challengeProgress } =
    options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showRiddle, setShowRiddle] = useState(false);
  const [localChallengeAttempts, setLocalChallengeAttempts] = useState<
    Record<string, ChallengeAttempt>
  >(() => ({ ...challengeProgress.resolvedAttempts }));
  const [sessionStarsEarned, setSessionStarsEarned] = useState(0);
  const [liveAttemptStats, setLiveAttemptStats] = useState(
    () => challengeProgress.attemptStats,
  );

  const chapterTelemetryRef = useRef({ wordHelpCount: 0, ttsReplayCount: 0 });
  const chapterEnteredAtRef = useRef<number | null>(null);
  const sessionElapsedRef = useRef(storyProgress?.totalTimeSpentSeconds ?? 0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(
    storyProgress?.totalTimeSpentSeconds ?? 0,
  );

  const sessionTargetSeconds = sessionDurationMins * 60;
  const sessionRemainingSeconds = Math.max(
    0,
    sessionTargetSeconds - sessionElapsedSeconds,
  );

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

  const totalStarsEarned =
    challengeProgress.totalStarsEarned + sessionStarsEarned;

  const getChallengeAttemptStats = useCallback(
    (challengeId: string | undefined) => {
      if (!challengeId) return { attemptCount: 0, lastHintsUsed: 0 };
      return (
        liveAttemptStats[challengeId] ?? {
          attemptCount: 0,
          lastHintsUsed: 0,
        }
      );
    },
    [liveAttemptStats],
  );

  const getChapterElapsedSeconds = useCallback(() => {
    const enteredAt = chapterEnteredAtRef.current;
    if (enteredAt === null) return 0;

    return Math.max(0, Math.floor((Date.now() - enteredAt) / 1000));
  }, []);

  useEffect(() => {
    chapterEnteredAtRef.current = Date.now();
  }, [currentPage]);

  const applyElapsedTime = useCallback((seconds: number) => {
    sessionElapsedRef.current += seconds;
    setSessionElapsedSeconds(sessionElapsedRef.current);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const liveTotal =
        sessionElapsedRef.current + getChapterElapsedSeconds();
      setSessionElapsedSeconds(liveTotal);
    }, 1000);

    return () => clearInterval(interval);
  }, [getChapterElapsedSeconds]);

  const recordTtsReplay = useCallback(() => {
    chapterTelemetryRef.current.ttsReplayCount += 1;
  }, []);

  const recordWordHelp = useCallback(() => {
    chapterTelemetryRef.current.wordHelpCount += 1;
  }, []);

  const persistChapterVisit = useCallback(
    async (
      page: number,
      bookmarkPage: number,
      mode: "complete" | "bookmark",
    ) => {
      const chapter = getChapterForPage(story, page);
      if (!chapter?.id) return;

      const timeSpentSeconds = getChapterElapsedSeconds();
      const { wordHelpCount, ttsReplayCount } = chapterTelemetryRef.current;

      if (mode === "complete") {
        await recordChapterProgressAction({
          childId,
          storyId: story.id,
          chapterId: chapter.id,
          chapterOrder: bookmarkPage,
          timeSpentSeconds,
          wordHelpCount,
          ttsReplayCount,
        });
      } else {
        await saveStoryBookmarkAction({
          childId,
          storyId: story.id,
          chapterId: chapter.id,
          chapterOrder: bookmarkPage,
          timeSpentSeconds,
        });
      }

      applyElapsedTime(timeSpentSeconds);
      chapterTelemetryRef.current = { wordHelpCount: 0, ttsReplayCount: 0 };
      chapterEnteredAtRef.current = Date.now();
    },
    [applyElapsedTime, childId, getChapterElapsedSeconds, story],
  );

  const saveCurrentBookmark = useCallback(async () => {
    const chapter = getChapterForPage(story, currentPage);
    if (!chapter?.id) return;

    await persistChapterVisit(currentPage, currentPage, "bookmark");
  }, [currentPage, persistChapterVisit, story]);

  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    return () => {
      const page = currentPageRef.current;
      const chapter = getChapterForPage(story, page);
      if (!chapter?.id) return;

      const enteredAt = chapterEnteredAtRef.current;
      if (enteredAt === null) return;

      const timeSpentSeconds = Math.max(
        0,
        Math.floor((Date.now() - enteredAt) / 1000),
      );

      void saveStoryBookmarkAction({
        childId,
        storyId: story.id,
        chapterId: chapter.id,
        chapterOrder: page,
        timeSpentSeconds,
      });
    };
  }, [childId, story.id]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage) return;

      const isMovingForward = page > currentPage;
      void persistChapterVisit(
        currentPage,
        page,
        isMovingForward ? "complete" : "bookmark",
      );
      setCurrentPage(page);
      setShowRiddle(false);
    },
    [currentPage, persistChapterVisit],
  );

  const handleChallengeSubmitted = useCallback(
    (updatedAttempt: ChallengeAttempt, starsFromUi?: number) => {
      setLocalChallengeAttempts((prev) => ({
        ...prev,
        [updatedAttempt.challengeId]: updatedAttempt,
      }));

      setLiveAttemptStats((prev) => {
        const prior = prev[updatedAttempt.challengeId];
        const attemptCount = Math.max(
          prior?.attemptCount ?? 0,
          updatedAttempt.attemptNumber,
        );

        return {
          ...prev,
          [updatedAttempt.challengeId]: {
            attemptCount,
            lastHintsUsed: updatedAttempt.usedHints ?? 0,
          },
        };
      });

      const dbPayload = parseAttemptPayloadForDb(updatedAttempt);

      void recordChallengeAttemptAction({
        childId,
        storyId: story.id,
        challengeId: updatedAttempt.challengeId,
        status: updatedAttempt.status as ChallengeStatus,
        attemptNumber: updatedAttempt.attemptNumber,
        hintsUsed: updatedAttempt.usedHints ?? 0,
        isCorrect: updatedAttempt.isCorrect ?? null,
        timeSpentSeconds: updatedAttempt.timeSpentSeconds ?? 0,
        answerId: dbPayload.answerId,
        textAnswer: dbPayload.textAnswer,
        submittedAnswerJson: dbPayload.submittedAnswerJson,
        speechAccuracy: dbPayload.speechAccuracy,
      }).then((result) => {
        if (!result.success || !result.attemptId) return;

        setLocalChallengeAttempts((prev) => ({
          ...prev,
          [updatedAttempt.challengeId]: {
            ...updatedAttempt,
            id: result.attemptId!,
          },
        }));

        if (result.starsEarned && result.starsEarned > 0) {
          setSessionStarsEarned((prev) => prev + result.starsEarned!);
        } else if (starsFromUi && updatedAttempt.status === "SOLVED") {
          setSessionStarsEarned((prev) => prev + starsFromUi);
        }
      });
    },
    [childId, story.id],
  );

  const handleStoryComplete = useCallback(async () => {
    await persistChapterVisit(currentPage, currentPage, "complete");
    await completeStoryAction({ childId, storyId: story.id });
  }, [childId, currentPage, persistChapterVisit, story.id]);

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
    sessionElapsedSeconds,
    sessionTargetSeconds,
    sessionRemainingSeconds,
    handlePageChange,
    handleChallengeSubmitted,
    handleStoryComplete,
    saveCurrentBookmark,
    recordTtsReplay,
    recordWordHelp,
    getChallengeAttemptStats,
  };
}
