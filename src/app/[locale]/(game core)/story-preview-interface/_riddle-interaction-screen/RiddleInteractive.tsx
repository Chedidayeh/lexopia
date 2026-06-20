"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import RiddleQuestion from "./RiddleQuestion";
import MultipleChoiceAnswer from "./MultipleChoiceAnswer";
import SequencingAnswer from "./SequencingAnswer";
import FillBlankAnswer from "./FillBlankAnswer";
import CompleteWordAnswer from "./CompleteWordAnswer";
import LetterTilesAnswer from "./LetterTilesAnswer";
import SoundMatchAnswer from "./SoundMatchAnswer";
import ReadAloudAnswer from "./ReadAloudAnswer";
import WordBuildAnswer from "./WordBuildAnswer";
import HintPanel from "./HintPanel";
import FeedbackDisplay from "./FeedbackDisplay";
import { Lightbulb } from "lucide-react";
import FloatingItems from "./FloatingItems";
import {
  Challenge,
  ChallengeStatus,
  ChallengeType,
  ChallengeAttempt,
} from "@readdly/shared-types";
import { useLocale } from "@/src/contexts/LocaleContext";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { transformChallengeToViewModel } from "./_lib/challenge-view-model";
import type { ChallengeViewModel } from "./_lib/challenge-view-model";
import {
  validateChallengeAnswer,
  type ChallengeSubmission,
} from "./_lib/validate-challenge-answer";
import { createChallengeAttempt } from "./_lib/create-challenge-attempt";

interface RiddleInteractiveProps {
  challenge?: Challenge | null;
  storyImage: string | null;
  storyImageAlt: string;
  onChallengeSubmitted?: (
    attempt: ChallengeAttempt,
    starsEarned?: number,
  ) => void;
  onClose?: () => void;
}

const SOLVED_MESSAGE_KEYS: Partial<Record<ChallengeType, string>> = {
  [ChallengeType.MULTIPLE_CHOICE]: "solvedAnswerMULTIPLE_CHOICE",
  [ChallengeType.TRUE_FALSE]: "solvedAnswerTRUE_FALSE",
  [ChallengeType.SEQUENCING]: "solvedAnswerSEQUENCING",
  [ChallengeType.FILL_BLANK]: "solvedAnswerFILL_BLANK",
  [ChallengeType.COMPLETE_WORD]: "solvedAnswerCOMPLETE_WORD",
  [ChallengeType.LETTER_DISCRIMINATION]: "solvedAnswerLETTER_DISCRIMINATION",
  [ChallengeType.SOUND_MATCH]: "solvedAnswerSOUND_MATCH",
  [ChallengeType.READ_ALOUD]: "solvedAnswerREAD_ALOUD",
  [ChallengeType.WORD_BUILD]: "solvedAnswerWORD_BUILD",
};

const RiddleInteractive = ({
  challenge,
  storyImage,
  storyImageAlt = "Story image",
  onChallengeSubmitted,
  onClose,
}: RiddleInteractiveProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");
  const { locale } = useLocale();

  const [viewModel] = useState<ChallengeViewModel>(() =>
    transformChallengeToViewModel(challenge!, storyImageAlt, locale),
  );

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [isHintPanelVisible, setIsHintPanelVisible] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{
    type: "solved" | "almost" | "incorrect" | null;
    message: string;
    isVisible: boolean;
  }>({
    type: null,
    message: "",
    isVisible: false,
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement>(null);

  const totalHints = viewModel.hints.length;
  const availableHints = totalHints - hintsUsed;

  useEffect(() => {
    if (!isTimerRunning) return;
    const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const playFeedbackSound = useCallback((type: "correct" | "incorrect") => {
    const soundRef = type === "correct" ? correctSoundRef : incorrectSoundRef;
    if (soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(() => undefined);
    }
  }, []);

  const getSolvedMessage = useCallback(
    (type: ChallengeType) => {
      const key = SOLVED_MESSAGE_KEYS[type];
      return key ? t(key) : t("solvedAnswerMULTIPLE_CHOICE");
    },
    [t],
  );

  const processSubmission = useCallback(
    (submission: ChallengeSubmission) => {
      const currentAttempt = attempts + 1;
      setAttempts(currentAttempt);

      const { isCorrect, isAlmost } = validateChallengeAnswer(
        viewModel,
        submission,
        viewModel.displayedSequenceItems,
      );

      if (isCorrect) {
        stopTimer();
        playFeedbackSound("correct");
        const localAttempt = createChallengeAttempt({
          challengeId: viewModel.id,
          status: ChallengeStatus.SOLVED,
          attemptNumber: currentAttempt,
          usedHints: hintsUsed,
          isCorrect: true,
          timeSpentSeconds: elapsedTime,
          submission,
        });
        onChallengeSubmitted?.(localAttempt, viewModel.starsReward);
        setFeedbackState({
          type: "solved",
          message: getSolvedMessage(viewModel.type),
          isVisible: true,
        });
      } else if (isAlmost) {
        stopTimer();
        playFeedbackSound("incorrect");
        const localAttempt = createChallengeAttempt({
          challengeId: viewModel.id,
          status: ChallengeStatus.INCORRECT,
          attemptNumber: currentAttempt,
          usedHints: hintsUsed,
          isCorrect: false,
          timeSpentSeconds: elapsedTime,
          submission,
        });
        onChallengeSubmitted?.(localAttempt);
        setFeedbackState({
          type: "almost",
          message: t("almostAnswer"),
          isVisible: true,
        });
      } else {
        stopTimer();
        playFeedbackSound("incorrect");
        const localAttempt = createChallengeAttempt({
          challengeId: viewModel.id,
          status: ChallengeStatus.INCORRECT,
          attemptNumber: currentAttempt,
          usedHints: hintsUsed,
          isCorrect: false,
          timeSpentSeconds: elapsedTime,
          submission,
        });
        onChallengeSubmitted?.(localAttempt);
        setFeedbackState({
          type: "incorrect",
          message: t("incorrectAnswer"),
          isVisible: true,
        });
      }

      setSelectedChoice(null);
    },
    [
      attempts,
      elapsedTime,
      getSolvedMessage,
      hintsUsed,
      onChallengeSubmitted,
      playFeedbackSound,
      stopTimer,
      t,
      viewModel,
    ],
  );

  const handleChoiceSubmit = () => {
    if (!selectedChoice) return;
    processSubmission({ kind: "choice", answerId: selectedChoice });
  };

  const handleSequencingSubmit = (reorderedIndices: number[]) => {
    const answerIds = reorderedIndices.map(
      (index) => viewModel.displayedSequenceItems[index]?.id,
    ).filter(Boolean) as string[];
    processSubmission({ kind: "order", answerIds });
  };

  const handleWordBuildSubmit = (orderedIds: string[]) => {
    processSubmission({ kind: "order", answerIds: orderedIds });
  };

  const handleReadAloudSubmit = (transcript: string) => {
    processSubmission({ kind: "text", value: transcript });
  };

  const handleRequestHint = () => {
    if (currentHintLevel < totalHints) {
      setCurrentHintLevel((prev) => prev + 1);
      setHintsUsed((prev) => prev + 1);
      setIsHintPanelVisible(true);
    }
  };

  const handleShowHintPanel = () => {
    if (currentHintLevel === 0) {
      handleRequestHint();
    } else {
      setIsHintPanelVisible(true);
    }
  };

  const handleTryAgain = () => {
    setFeedbackState({ type: null, message: "", isVisible: false });
    setIsTimerRunning(true);
  };

  const handleContinue = (action: "solved" | "skipped") => {
    stopTimer();

    if (action === "skipped") {
      const localAttempt = createChallengeAttempt({
        challengeId: viewModel.id,
        status: ChallengeStatus.SKIPPED,
        attemptNumber: attempts,
        usedHints: hintsUsed,
        isCorrect: null,
        timeSpentSeconds: elapsedTime,
      });
      onChallengeSubmitted?.(localAttempt);
    }

    onClose?.();
  };

  const handlePlayAudio = () => {
    if (!audioRef.current || !viewModel.questionAudioUrl) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const renderAnswerPanel = () => {
    switch (viewModel.type) {
      case ChallengeType.SEQUENCING:
        return (
          <SequencingAnswer
            items={viewModel.displayedSequenceItems}
            onSubmit={handleSequencingSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.FILL_BLANK:
        return (
          <FillBlankAnswer
            sentenceTemplate={viewModel.sentenceTemplate || viewModel.question}
            wordBank={viewModel.wordBank}
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            onSubmit={handleChoiceSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.COMPLETE_WORD:
        return (
          <CompleteWordAnswer
            sentenceTemplate={viewModel.sentenceTemplate || viewModel.question}
            tiles={viewModel.letterTiles}
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            onSubmit={handleChoiceSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.LETTER_DISCRIMINATION:
        return (
          <LetterTilesAnswer
            tiles={viewModel.letterTiles}
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            onSubmit={handleChoiceSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.SOUND_MATCH:
        return (
          <SoundMatchAnswer
            promptAudioUrl={viewModel.questionAudioUrl}
            choices={viewModel.choices}
            selectedChoice={selectedChoice}
            onSelect={setSelectedChoice}
            onSubmit={handleChoiceSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.READ_ALOUD:
        return (
          <ReadAloudAnswer
            targetWord={viewModel.targetWord}
            onSubmit={handleReadAloudSubmit}
            isDisabled={feedbackState.isVisible}
            languageCode={locale?.split("-")[0].toLowerCase() || "en"}
          />
        );

      case ChallengeType.WORD_BUILD:
        return (
          <WordBuildAnswer
            tiles={viewModel.letterTiles}
            onSubmit={handleWordBuildSubmit}
            isDisabled={feedbackState.isVisible}
          />
        );

      case ChallengeType.MULTIPLE_CHOICE:
      case ChallengeType.TRUE_FALSE:
      default:
        return (
          <>
            <MultipleChoiceAnswer
              choices={viewModel.choices}
              selectedChoice={selectedChoice}
              onSelect={setSelectedChoice}
              isDisabled={feedbackState.isVisible}
            />
            <Button
              variant="secondary"
              onClick={handleChoiceSubmit}
              disabled={!selectedChoice || feedbackState.isVisible}
              className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base"
            >
              {t("submitAnswer")}
            </Button>
          </>
        );
    }
  };

  return (
    <div className="pt-16 md:pt-0 sm:pt-20 pb-20 sm:pb-24 md:pb-28 lg:pb-32">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-5xl">
        <FloatingItems
          attempts={attempts}
          hintsUsed={hintsUsed}
          totalHints={totalHints}
        />

        <div className="mt-4 sm:mt-6">
          <RiddleQuestion
            question={viewModel.question}
            storyImage={storyImage || viewModel.storyImage}
            storyImageAlt={viewModel.storyImageAlt}
            riddleNumber={1}
            totalRiddles={1}
            onAudioPlay={handlePlayAudio}
            isAudioPlaying={isPlayingAudio}
            elapsedTime={elapsedTime}
            challengeType={viewModel.type}
            hasAudio={!!viewModel.questionAudioUrl}
          />
        </div>

        <audio
          ref={audioRef}
          src={viewModel.questionAudioUrl || ""}
          onEnded={() => setIsPlayingAudio(false)}
          onPlay={() => setIsPlayingAudio(true)}
          onPause={() => setIsPlayingAudio(false)}
        />

        <audio ref={correctSoundRef} src="/soundtracks/correct-answer.mp3" />
        <audio ref={incorrectSoundRef} src="/soundtracks/wrong-answer.mp3" />

        <div className="mt-4 sm:mt-6 bg-card rounded-xl shadow-warm-lg p-4 sm:p-6">
          {renderAnswerPanel()}
        </div>

        <HintPanel
          hints={viewModel.hints}
          currentHintLevel={currentHintLevel}
          availableHints={availableHints}
          onRequestHint={handleRequestHint}
          isVisible={isHintPanelVisible}
          onClose={() => setIsHintPanelVisible(false)}
        />

        <FeedbackDisplay
          type={feedbackState.type}
          message={feedbackState.message}
          starsEarned={
            feedbackState.type === "solved" ? viewModel.starsReward : 0
          }
          onContinue={handleContinue}
          onTryAgain={handleTryAgain}
          isVisible={feedbackState.isVisible}
        />
      </div>

      {totalHints > 0 && (
        <div className="fixed right-2 sm:right-4 md:right-6 lg:right-8 top-22 sm:top-24 md:top-28 lg:top-32 z-50 pointer-events-none">
          <button
            onClick={handleShowHintPanel}
            className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-secondary text-white rounded-full shadow-warm hover:scale-105 transition-smooth disabled:opacity-50 text-xs sm:text-sm shrink-0"
          >
            <Lightbulb size={18} className="sm:size-5" />
            <span className="hidden sm:inline font-heading font-bold">
              {t("needAHint")} ({availableHints})
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RiddleInteractive;
