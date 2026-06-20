"use client";

import { Button } from "@/src/components/ui/button";
import { CheckCircle, Lightbulb, SparklesIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Hint {
  text: string;
}

interface HintPanelProps {
  hints: Hint[];
  currentHintLevel: number;
  availableHints: number;
  onRequestHint: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const HintPanel = ({
  hints,
  currentHintLevel,
  availableHints,
  onRequestHint,
  isVisible,
  onClose,
}: HintPanelProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");
  
  if (!isVisible) return null;

  const currentHint = hints[currentHintLevel - 1];
  const hasMoreHints = currentHintLevel < hints.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-xl shadow-warm-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-2 border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 text-white bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="sm:size-6" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-xl text-foreground">
                {t("hintPanel.title")}
              </h2>
              <p className="font-caption text-xs sm:text-sm text-muted-foreground">
                {t("hintPanel.hintsRemaining", { count: availableHints })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-lg hover:bg-muted transition-smooth flex-shrink-0 ml-2"
            aria-label="Close hint panel"
          >
            <X size={20} className="sm:size-6" />
          </button>
        </div>

        {/* Friendly Character */}
        <div className="p-4 sm:p-6 flex justify-center">
          <div className="relative w-40 sm:w-60 h-40 sm:h-60 rounded-2xl overflow-hidden">
            <img
              src="/hint-avatars/need-help.png"
              className=" object-contain shadow-warm"
            />
          </div>
        </div>

        {/* Current Hint */}
        {currentHint && (
          <div className="px-3 sm:px-6 pb-2">
            <div className="p-4 sm:p-6 rounded-xl border-2 border-secondary bg-secondary/10">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="font-caption text-xs sm:text-sm uppercase tracking-wider font-semibold text-secondary">
                  {t("hintPanel.hintCounter", { current: currentHintLevel, total: hints.length })}
                </span>
              </div>
              <p className="font-body text-sm sm:text-lg text-foreground leading-relaxed">
                {currentHint.text}
              </p>
            </div>
          </div>
        )}

        {/* Previous Hints */}
        {currentHintLevel > 1 && (
          <div className="px-3 sm:px-6 pb-2">
            <h3 className="font-heading text-sm sm:text-lg text-foreground mb-2 sm:mb-3">
              {t("hintPanel.previousHints")}
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {hints.slice(0, currentHintLevel - 1).map((hint, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 rounded-lg bg-muted border border-border"
                >
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <CheckCircle size={14} className="sm:size-4 text-success flex-shrink-0" />
                    <span className="font-caption text-xs sm:text-sm text-muted-foreground">
                      {t("hintPanel.hintCounter", { current: index + 1, total: hints.length })}
                    </span>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-foreground opacity-70">
                    {hint.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 border-border">
          <div className="flex items-center justify-center">
            <Button variant={"outline"} onClick={onClose} className="text-xs sm:text-sm">
              {t("hintPanel.closeButton")}
            </Button>
          </div>
          {hasMoreHints && availableHints > 0 ? (
            <Button variant={"secondary"} onClick={onRequestHint} className="text-xs sm:text-sm">
              {t("hintPanel.getAnotherHint", { remaining: availableHints })}
            </Button>
          ) : (
            <div className="text-center p-2 sm:p-4 bg-muted rounded-xl">
              <p className="font-body text-xs sm:text-sm text-foreground">
                {availableHints === 0
                  ? t("hintPanel.noMoreHints")
                  : t("hintPanel.allHintsRevealed")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HintPanel;
