"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StoryContent from "./StoryContent";
import ReadingSettings from "./ReadingSettings";
import { CircleQuestionMark, Settings, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import RiddleInteractive from "../_riddle-interaction-screen/RiddleInteractive";
import StoryFlowNavigation from "./StoryFlowNavigation";
import { splitSentences } from "./storyDataTransform";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import { ChallengeStatus, Story } from "@readdly/shared-types";
import { useStoryReadingSession } from "../_lib/useStoryReadingSession";
import { canProceedFromChallengePage } from "../_lib/story-reading-session";
import type {
  StoryChallengeProgress,
  StoryReadingProgress,
} from "@/src/lib/story-progress/types";

const SENTENCE_PAUSE_CHARS = 9;

function computeSentenceBoundaries(
  sentences: string[],
  duration: number,
): { start: number; end: number }[] {
  const weights = sentences.map((s) => s.length + SENTENCE_PAUSE_CHARS);
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0 || duration === 0) return [];
  const boundaries: { start: number; end: number }[] = [];
  let accumulated = 0;
  for (const w of weights) {
    const start = (accumulated / total) * duration;
    accumulated += w;
    const end = (accumulated / total) * duration;
    boundaries.push({ start, end });
  }
  return boundaries;
}

interface StoryReadingInteractiveProps {
  story: Story;
  childId: string;
  initialPage: number;
  sessionDurationMins: number;
  storyProgress: StoryReadingProgress | null;
  challengeProgress: StoryChallengeProgress;
}

const StoryReadingInteractive = ({
  story,
  childId,
  initialPage,
  sessionDurationMins,
  storyProgress,
  challengeProgress,
}: StoryReadingInteractiveProps) => {
  const t = useTranslations("StoryReadingInterface");
  const { locale } = useLocale();

  const {
    currentPage,
    showRiddle,
    setShowRiddle,
    localizedPages,
    localizedTitle,
    currentPageData,
    currentChallenge,
    currentChallengeAttempt,
    navigationChallengeState,
    totalStarsEarned,
    sessionElapsedSeconds,
    sessionTargetSeconds,
    handlePageChange,
    handleChallengeSubmitted,
    handleStoryComplete,
    saveCurrentBookmark,
    recordTtsReplay,
    getChallengeAttemptStats,
  } = useStoryReadingSession(story, locale, {
    childId,
    initialPage,
    sessionDurationMins,
    storyProgress,
    challengeProgress,
  });

  const currentChallengeStats = getChallengeAttemptStats(currentChallenge?.id);

  const [textSize, setTextSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [highContrast, setHighContrast] = useState(false);
  const [highlightedSentence, setHighlightedSentence] = useState<
    number | undefined
  >();
  const sentenceBoundariesRef = useRef<{ start: number; end: number }[]>([]);
  const lastSentenceIdxRef = useRef<number>(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoAdvanceEnabledRef = useRef(false);
  const shouldAutoPlayNextRef = useRef(false);

  const syncSentenceBoundaries = useCallback(() => {
    const el = audioRef.current;
    if (!el?.duration || isNaN(el.duration) || el.duration === 0) return;

    const text = currentPageData?.text ?? "";
    const sentences = splitSentences(text);
    sentenceBoundariesRef.current = computeSentenceBoundaries(
      sentences,
      el.duration,
    );
    lastSentenceIdxRef.current = -1;
  }, [currentPageData?.text]);

  const updateHighlightForTime = useCallback((time: number) => {
    const boundaries = sentenceBoundariesRef.current;
    if (boundaries.length === 0) return;

    let idx = boundaries.findIndex((b) => time < b.end);
    if (idx === -1) idx = boundaries.length - 1;
    if (idx !== lastSentenceIdxRef.current) {
      lastSentenceIdxRef.current = idx;
      setHighlightedSentence(idx);
    }
  }, []);

  const resetHighlights = useCallback(() => {
    setHighlightedSentence(undefined);
    lastSentenceIdxRef.current = -1;
  }, []);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlayingAudio(false);
    resetHighlights();
  }, [resetHighlights]);

  const startPlayback = useCallback(() => {
    if (!audioRef.current || !currentPageData?.audioUrl) return false;

    syncSentenceBoundaries();
    void audioRef.current
      .play()
      .then(() => {
        if (!audioRef.current) return;
        updateHighlightForTime(audioRef.current.currentTime);
        setIsPlayingAudio(true);
      })
      .catch(() => {
        setIsPlayingAudio(false);
      });
    return true;
  }, [currentPageData?.audioUrl, syncSentenceBoundaries, updateHighlightForTime]);

  const tryAutoPlayAfterAdvance = useCallback(() => {
    if (!shouldAutoPlayNextRef.current) return;
    if (!audioRef.current || !currentPageData?.audioUrl) return;

    shouldAutoPlayNextRef.current = false;
    autoAdvanceEnabledRef.current = true;
    startPlayback();
  }, [currentPageData?.audioUrl, startPlayback]);

  const handlePageChangeWithReset = useCallback(
    (page: number) => {
      autoAdvanceEnabledRef.current = false;
      shouldAutoPlayNextRef.current = false;
      stopAudio();
      sentenceBoundariesRef.current = [];
      resetHighlights();
      handlePageChange(page);
    },
    [handlePageChange, resetHighlights, stopAudio],
  );

  const handleAudioEnded = useCallback(() => {
    setIsPlayingAudio(false);
    resetHighlights();

    if (!autoAdvanceEnabledRef.current) return;
    if (currentPageData?.hasRiddle) return;
    if (currentPage >= localizedPages.length) return;

    shouldAutoPlayNextRef.current = true;
    sentenceBoundariesRef.current = [];
    handlePageChange(currentPage + 1);
  }, [
    currentPage,
    currentPageData?.hasRiddle,
    handlePageChange,
    localizedPages.length,
    resetHighlights,
  ]);

  useEffect(() => {
    if (!shouldAutoPlayNextRef.current) return;

    const el = audioRef.current;
    if (!el || !currentPageData?.audioUrl) return;

    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      tryAutoPlayAfterAdvance();
      return;
    }

    const onReady = () => tryAutoPlayAfterAdvance();
    el.addEventListener("canplay", onReady, { once: true });
    return () => el.removeEventListener("canplay", onReady);
  }, [currentPage, currentPageData?.audioUrl, tryAutoPlayAfterAdvance]);

  const handlePlayAudio = () => {
    if (!audioRef.current || !currentPageData?.audioUrl) return;

    if (isPlayingAudio) {
      autoAdvanceEnabledRef.current = false;
      audioRef.current.pause();
      setIsPlayingAudio(false);
      resetHighlights();
      return;
    }

    autoAdvanceEnabledRef.current = true;
    startPlayback();
    setIsPlayingAudio(true);
  };

  const handleRepeatAudio = () => {
    if (!audioRef.current || !currentPageData?.audioUrl) return;

    recordTtsReplay();
    autoAdvanceEnabledRef.current = true;
    resetHighlights();
    syncSentenceBoundaries();
    audioRef.current.currentTime = 0;
    void audioRef.current.play().then(() => {
      updateHighlightForTime(0);
    });
    setIsPlayingAudio(true);
  };

  const shouldShowRiddleButton =
    !!currentPageData?.hasRiddle &&
    !canProceedFromChallengePage(true, currentChallengeAttempt);

  if (!currentPageData) {
    return null;
  }

  return (
    <div className="pt-16 sm:pt-20 pb-20 sm:pb-24 md:pb-28 lg:pb-32 flex flex-col">
      <StoryFlowNavigation
        storyTitle={localizedTitle}
        currentPage={currentPage}
        riddleMode={currentPageData.hasRiddle}
        showRiddle={showRiddle}
        setShowRiddle={setShowRiddle}
        totalPages={localizedPages.length}
        onPageChange={handlePageChangeWithReset}
        currentChallengeAttemptState={navigationChallengeState}
        totalStarsEarned={totalStarsEarned}
        audioUrl={currentPageData.audioUrl}
        isPlayingAudio={isPlayingAudio}
        isLoadingAudio={isLoadingAudio}
        handlePlayAudio={handlePlayAudio}
        handleRepeatAudio={handleRepeatAudio}
        onStoryComplete={handleStoryComplete}
        childId={childId}
        sessionElapsedSeconds={sessionElapsedSeconds}
        sessionTargetSeconds={sessionTargetSeconds}
        onExit={saveCurrentBookmark}
      />
      {!showRiddle ? (
        <>
          <audio
            key={currentPageData.audioUrl || currentPage}
            ref={audioRef}
            src={currentPageData.audioUrl || ""}
            preload="auto"
            onLoadStart={() => setIsLoadingAudio(true)}
            onCanPlay={() => {
              setIsLoadingAudio(false);
              syncSentenceBoundaries();
              tryAutoPlayAfterAdvance();
            }}
            onLoadedMetadata={() => syncSentenceBoundaries()}
            onDurationChange={() => {
              syncSentenceBoundaries();
              const el = audioRef.current;
              if (el && !el.paused) {
                updateHighlightForTime(el.currentTime);
              }
            }}
            onEnded={handleAudioEnded}
            onPlay={() => setIsPlayingAudio(true)}
            onPause={() => setIsPlayingAudio(false)}
            onTimeUpdate={() => {
              const el = audioRef.current;
              if (!el || el.paused || isNaN(el.currentTime)) return;
              updateHighlightForTime(el.currentTime);
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-20 max-w-4xl">
                <StoryContent
                  currentPage={currentPageData}
                  textSize={textSize}
                  highContrast={highContrast}
                  highlightedSentence={highlightedSentence}
                />

                {shouldShowRiddleButton && (
                  <motion.div
                    layout
                    className="flex mt-4 flex-col items-center gap-2 sm:gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      variant={"secondary"}
                      onClick={() => setShowRiddle(true)}
                    >
                      <span>{t("storyFlowNavigation.solveRiddle")}</span>
                    </Button>
                  </motion.div>
                )}

                {currentPageData.hasRiddle && currentChallengeAttempt && (
                  <motion.div
                    layout
                    className="flex mt-4 flex-col items-center gap-1 sm:gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {currentChallengeAttempt.status ===
                      ChallengeStatus.SOLVED && (
                      <span className="font-medium text-secondary">
                        ✓ {t("storyFlowNavigation.challengeSolved")}
                      </span>
                    )}
                    {currentChallengeAttempt.status ===
                      ChallengeStatus.SKIPPED && (
                      <span className="font-medium text-primary">
                        ⊘ {t("storyFlowNavigation.challengeSkipped")}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="fixed right-2 sm:right-4 md:right-6 lg:right-8 bottom-20 sm:bottom-24 md:bottom-28 lg:bottom-32 flex md:flex-col gap-2 sm:gap-3 z-40">
            <motion.button
              onClick={() => setShowSettings(true)}
              whileHover={{ scale: 1.06 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-card hover:bg-accent hover:text-white text-foreground rounded-full shadow-warm-lg hover:scale-110 transition-smooth flex items-center justify-center shrink-0"
              aria-label="Reading settings"
            >
              <Settings size={20} className="sm:size-6" />
            </motion.button>

            <motion.button
              onClick={() => setShowHelp(true)}
              whileHover={{ scale: 1.06 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-card hover:bg-accent hover:text-white text-foreground rounded-full shadow-warm-lg hover:scale-110 transition-smooth flex items-center justify-center shrink-0"
              aria-label="Reading help"
            >
              <CircleQuestionMark size={20} className="sm:size-6" />
            </motion.button>
          </div>
        </>
      ) : (
        <AnimatePresence>
          {showRiddle && currentChallenge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <RiddleInteractive
                challenge={currentChallenge}
                storyImage={currentPageData.image}
                storyImageAlt={currentPageData.alt}
                onChallengeSubmitted={handleChallengeSubmitted}
                onClose={() => setShowRiddle(false)}
                initialAttemptCount={currentChallengeStats.attemptCount}
                initialHintsUsed={currentChallengeStats.lastHintsUsed}
                resolvedAttempt={currentChallengeAttempt}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {showSettings && (
        <ReadingSettings
          textSize={textSize}
          onTextSizeChange={setTextSize}
          highContrast={highContrast}
          onHighContrastToggle={() => setHighContrast(!highContrast)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-card rounded-xl shadow-warm-xl p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="font-heading text-xl sm:text-2xl text-foreground">
                {t("readingHelp.title")}
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 sm:p-2 hover:bg-accent hover:text-white rounded-full transition-smooth shrink-0 ml-2"
                aria-label="Close help"
              >
                <X size={20} className="sm:size-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1">
                  <p className="font-body font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t("readingHelp.navigation")}
                  </p>
                  <p className="font-caption text-xs sm:text-sm text-muted-foreground">
                    {t("readingHelp.navigationDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1">
                  <p className="font-body font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t("readingHelp.audioReading")}
                  </p>
                  <p className="font-caption text-xs sm:text-sm text-muted-foreground">
                    {t("readingHelp.audioReadingDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1">
                  <p className="font-body font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {t("readingHelp.riddles")}
                  </p>
                  <p className="font-caption text-xs sm:text-sm text-muted-foreground">
                    {t("readingHelp.riddlesDesc")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Button variant="accent" onClick={() => setShowHelp(false)}>
                {t("readingHelp.gotIt")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryReadingInteractive;
