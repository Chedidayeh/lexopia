"use client";

import { Button } from "@/src/components/ui/button";
import {
  CheckCircle,
  CircleCheck,
  CircleX,
  Lightbulb,
  SparklesIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface Hint {
  level: number;
  text: string;
  difficulty: "easy" | "medium" | "hard";
}

import { Star, type LucideIcon } from "lucide-react";

interface FeedbackDisplayProps {
  type: "solved" | "almost" | "incorrect" | null;
  message: string;
  starsEarned?: number;
  onContinue: (action: "solved" | "skipped") => void;
  onTryAgain: () => void;
  isVisible: boolean;
}

const FeedbackDisplay2 = ({
  type,
  message,
  starsEarned = 0,
  onContinue,
  onTryAgain,
  isVisible,
}: FeedbackDisplayProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  if (!isVisible || !type) return null;

  const getTitleForType = (feedbackType: "solved" | "almost" | "incorrect") => {
    switch (feedbackType) {
      case "solved":
        return t("feedbackDisplay.solvedTitle");
      case "almost":
        return t("feedbackDisplay.almostTitle");
      case "incorrect":
        return t("feedbackDisplay.incorrectTitle");
    }
  };

  const feedbackConfig = {
    solved: {
      bgColor: "bg-secondary/80",
      title: getTitleForType("solved"),
    },
    almost: {
      bgColor: "bg-secondary/20",
      title: getTitleForType("almost"),
    },
    incorrect: {
      bgColor: "bg-secondary/20",
      title: getTitleForType("incorrect"),
    },
  };

  const config = feedbackConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-xl shadow-warm-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-2 border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 text-white ${type === "incorrect" ? "bg-red-500" : "bg-primary"}
             rounded-full flex items-center justify-center flex-shrink-0`}
            >
              {type === "incorrect" && (
                <CircleX size={18} className="sm:size-6" />
              )}
              {type === "solved" && (
                <CircleCheck size={18} className="sm:size-6" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-xl text-foreground">
                {config.title}
              </h2>
            </div>
          </div>
          {type !== "solved" ? (
            <Button
              variant={"outline"}
              onClick={() => onContinue("skipped")}
              className="text-xs sm:text-sm flex-1 max-w-max"
            >
              {t("feedbackDisplay.skipButton")}
            </Button>
          ) : (
            <div className="w-24" /> // Placeholder to keep spacing consistent
          )}
        </div>

        <div className="p-4 sm:p-6">
          {/* Friendly Character */}
          <div className="p-4 sm:p-6 flex justify-center">
            <div className="relative w-40 sm:w-60 h-40 sm:h-60 rounded-2xl overflow-hidden">
              <img
                src={
                  type === "solved"
                    ? "/hint-avatars/great-work.png"
                    : "/hint-avatars/try-again.png"
                }
                className=" object-contain shadow-warm"
              />
            </div>
          </div>

          <div className="text-center mb-4 sm:mb-6">
            <p className="font-body text-sm sm:text-xl text-foreground leading-relaxed">
              {message}
            </p>
          </div>

          {/* Stars Earned (for correct answers) */}
          {type === "solved" && starsEarned > 0 && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/40 rounded-xl">
              <Star
                size={20}
                className="sm:size-6 fill-amber-500 text-amber-500"
              />
              <span className="font-heading text-xl sm:text-2xl text-foreground">
                {t("feedbackDisplay.starsEarned", { count: starsEarned })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            {type === "solved" ? (
              <div className="flex items-center justify-center">
                <Button
                  variant={"default"}
                  onClick={() => onContinue("solved")}
                  className="text-sm sm:text-base"
                >
                  {t("feedbackDisplay.continueButton")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <Button
                  variant={"secondary"}
                  onClick={onTryAgain}
                  className="text-xs sm:text-sm flex-1 w-full"
                >
                  {t("feedbackDisplay.tryAgainButton")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay2;
