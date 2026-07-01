"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader,
  RotateCcw,
  Star,
  Play,
  Pause,
} from "lucide-react";
import { motion } from "framer-motion";
import { ChallengeAttempt, ChallengeStatus } from "@readdly/shared-types";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
interface StoryFlowNavigationProps {
  storyTitle?: string;
  currentPage?: number;
  riddleMode: boolean;
  showRiddle: boolean;
  setShowRiddle: (value: boolean) => void;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  currentChallengeAttemptState: ChallengeAttempt | undefined;
  totalStarsEarned?: number;
  audioUrl?: string | null;
  isPlayingAudio?: boolean;
  isLoadingAudio?: boolean;
  handlePlayAudio?: () => void;
  handleRepeatAudio?: () => void;
  onStoryComplete?: () => void | Promise<void>;
  childId?: string;
  isPreviewMode?: boolean;
}

const StoryFlowNavigation = ({
  storyTitle = "Story Title",
  currentPage = 1,
  riddleMode = false,
  showRiddle,
  setShowRiddle,
  totalPages = 10,
  onPageChange,
  currentChallengeAttemptState,
  totalStarsEarned = 0,
  audioUrl,
  isPlayingAudio,
  isLoadingAudio,
  handlePlayAudio,
  handleRepeatAudio,
  onStoryComplete,
  childId,
  isPreviewMode = false,
}: StoryFlowNavigationProps) => {
  const t = useTranslations("StoryReadingInterface");
  const { isRTL } = useLocale();
  const [isStoryComplete, setIsStoryComplete] = useState(false);
  const router = useRouter();
  const handleBack = () => {
    if (isPreviewMode) {
      window.close();
      return;
    }
    if (showRiddle) {
      setShowRiddle(false);
      return;
    }
    if (childId) {
      window.close();
      return;
    }
    window.close();
    return;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && onPageChange) {
      if (isPlayingAudio) {
        handlePlayAudio?.();
      }

      onPageChange(currentPage - 1);
      // Timer will automatically disable since we're no longer on the checkpointed page
    }
  };

  const handleNextPage = () => {
    if (isPlayingAudio) {
      handlePlayAudio?.();
    }
    // Check if this is the last page
    const isLastPage = currentPage === totalPages;

    // Handle story completion when on the last page
    if (isLastPage) {
      setIsStoryComplete(true);
      void onStoryComplete?.();
      if (isPreviewMode) {
        window.close();
        return;
      }
      if (childId) {
        window.close();
        return;
      } else {
        window.close();
        return;
      }
    }

    // Navigate to next page if not on last page
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const progressPercentage = (currentPage / totalPages) * 100;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50`}>
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`absolute top-0 left-0 right-0 border-b bg-card shadow-warm-md transition-smooth pointer-events-auto`}
      >
        <div className="relative flex items-center justify-center px-6 sm:px-6 md:px-6 lg:px-8 py-3 sm:py-4 min-h-16 sm:min-h-20">
          {/* Back Button */}
          <Button
            variant={"outline"}
            onClick={handleBack}
            aria-label="Back"
            className={`absolute ${isRTL ? "right-4 sm:right-4 md:right-4 lg:right-8" : "left-4 sm:left-4 md:left-4 lg:left-8"} text-xs sm:text-sm`}
          >
            {isRTL ? (
              <ChevronRight size={18} className="sm:size-5" />
            ) : (
              <ChevronLeft size={18} className="sm:size-5" />
            )}
            {showRiddle ? (
              <span className="sm:inline md:ml-2">
                {t("storyFlowNavigation.returnToStory")}
              </span>
            ) : (
              <span className="hidden sm:inline ml-1 sm:ml-2">
                {t("storyFlowNavigation.backButton")}
              </span>
            )}
          </Button>

          {/* Story Title */}
          {riddleMode ? (
            <motion.div
              layout
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 px-2 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl sm:text-2xl text-white">
                    <Lightbulb />
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-heading text-secondary font-medium text-sm md:text-base">
                    {t("storyFlowNavigation.riddleTime")}
                  </p>
                  <p className="font-body text-xs md:text-sm text-muted-foreground">
                    {t("storyFlowNavigation.riddleTimeText")}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="font-heading text-sm sm:text-base md:text-lg lg:text-xl text-foreground truncate max-w-35 sm:max-w-xs md:max-w-md px-2">
                {storyTitle}
              </h1>

              {/* <span className="font-data text-xl sm:text-2xl md:text-3xl font-medium text-primary">
                {currentPage}
              </span> */}
              <span className="font-caption text-xs sm:text-sm text-muted-foreground">
                {t("storyFlowNavigation.pageProgress", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
            </div>
          )}

          {/* Stars earned display */}
          <div
            className={`absolute ${isRTL ? "left-4 sm:left-4 md:left-4 lg:left-8" : "right-4 sm:right-4 md:right-4 lg:right-8"} flex items-center gap-3 sm:gap-2 md:gap-4`}
          >
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Star
                size={16}
                className="sm:size-5 text-primary"
                fill="currentColor"
              />
              <span className="font-heading font-medium text-sm sm:text-base text-foreground">
                {totalStarsEarned}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Bottom Navigation Controls */}
      {!showRiddle && !isStoryComplete && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className={`fixed bottom-0 left-0 right-0 border-t bg-card shadow-warm-md transition-smooth pointer-events-auto z-50`}
        >
          <div className="relative flex items-center justify-between px-6 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-3 sm:py-4 min-h-16 sm:min-h-20">
            {/* Previous Button */}
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label={t("storyFlowNavigation.previousButton")}
              className="text-xs sm:text-sm"
            >
              {isRTL ? (
                <ChevronRight size={18} className="sm:size-5" />
              ) : (
                <ChevronLeft size={18} className="sm:size-5" />
              )}{" "}
              <span className="hidden md:inline">
                {t("storyFlowNavigation.previousButton")}
              </span>
            </Button>

            {/* Page Counter */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              {audioUrl && showRiddle === false && (
                <>
                  <Button
                    variant={"accent"}
                    size={"sm"}
                    className="z-50 pointer-events-auto"
                    onClick={handlePlayAudio}
                    disabled={!audioUrl || isLoadingAudio}
                    aria-label={isPlayingAudio ? "Pause audio" : "Play audio"}
                  >
                    {isLoadingAudio ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span className="hidden sm:inline">
                          {t("playAudio.loading")}
                        </span>
                      </>
                    ) : isPlayingAudio ? (
                      <>
                        <Pause size={18} />
                        <span className="hidden sm:inline">
                          {t("playAudio.pause")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        <span className="hidden sm:inline">
                          {t("playAudio.play")}
                        </span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant={"outline"}
                    size={"sm"}
                    className="z-50 pointer-events-auto"
                    onClick={handleRepeatAudio}
                    disabled={!audioUrl || isLoadingAudio}
                    aria-label="Repeat audio from start"
                  >
                    <RotateCcw size={18} />
                    <span className="hidden sm:inline">
                      {t("playAudio.repeat")}
                    </span>
                  </Button>
                </>
              )}
            </div>

            {/* Next Button */}
            <Button
              onClick={handleNextPage}
              disabled={
                currentChallengeAttemptState?.status ==
                ChallengeStatus.NOT_ATTEMPTED
              }
              className="relative text-xs sm:text-sm"
            >
              <span className="hidden md:inline">
                {currentPage === totalPages ? (
                  <span className="flex items-center">
                    {t("storyFlowNavigation.completionMessage")}{" "}
                    {isRTL ? (
                      <ChevronLeft size={18} className="sm:size-5" />
                    ) : (
                      <ChevronRight size={18} className="sm:size-5" />
                    )}
                  </span>
                ) : currentChallengeAttemptState?.status ==
                  ChallengeStatus.NOT_ATTEMPTED ? (
                  t("storyFlowNavigation.solveRiddle")
                ) : (
                  <span className="flex items-center">
                    {t("storyFlowNavigation.nextButton")}{" "}
                    {isRTL ? (
                      <ChevronLeft size={18} className="sm:size-5" />
                    ) : (
                      <ChevronRight size={18} className="sm:size-5" />
                    )}
                  </span>
                )}
              </span>
              <span className="md:hidden">
                {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StoryFlowNavigation;
