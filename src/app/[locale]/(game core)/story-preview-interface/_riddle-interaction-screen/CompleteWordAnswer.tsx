"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";

interface LetterTile {
  id: string;
  text: string;
}

interface CompleteWordAnswerProps {
  sentenceTemplate: string;
  tiles: LetterTile[];
  selectedChoice: string | null;
  onSelect: (choiceId: string | null) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}

type WordSegment = {
  char: string;
  isBlank: boolean;
};

type ParsedTemplate = {
  before: string;
  segments: WordSegment[];
  after: string;
};

function parseCompleteWordTemplate(template: string): ParsedTemplate {
  const match = template.match(/^(.*?)(\S*_\S*)([\s\S]*)$/);

  if (!match) {
    return {
      before: template,
      segments: [],
      after: "",
    };
  }

  const [, before, word, after] = match;
  const segments = word.split("").map((char) => ({
    char: char === "_" ? "" : char,
    isBlank: char === "_",
  }));

  return { before, segments, after };
}

const springFast = { type: "spring" as const, stiffness: 720, damping: 34, mass: 0.6 };
const tweenFast = { duration: 0.15, ease: "easeOut" as const };

const CompleteWordAnswer = ({
  sentenceTemplate,
  tiles,
  selectedChoice,
  onSelect,
  onSubmit,
  isDisabled,
}: CompleteWordAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  const parsed = useMemo(
    () => parseCompleteWordTemplate(sentenceTemplate),
    [sentenceTemplate],
  );

  const selectedTile = tiles.find((tile) => tile.id === selectedChoice) ?? null;

  const handleTileSelect = (tileId: string) => {
    if (isDisabled) return;
    onSelect(selectedChoice === tileId ? null : tileId);
  };

  const handleClearSlot = () => {
    if (isDisabled || !selectedChoice) return;
    onSelect(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <label className="block font-body font-semibold text-foreground text-lg">
        {t("completeWordAnswer.instructions")}
      </label>

      <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 p-4 sm:p-6">
        <p className="font-body text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
          {parsed.before && <span>{parsed.before}</span>}

          {parsed.segments.length > 0 && (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-lg bg-card/80 border border-secondary/20 shadow-sm">
              {parsed.segments.map((segment, index) => {
                if (!segment.isBlank) {
                  return (
                    <motion.span
                      key={`char-${index}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, ...tweenFast }}
                      className="font-heading text-2xl sm:text-3xl tracking-widest text-foreground"
                    >
                      {segment.char}
                    </motion.span>
                  );
                }

                const isFilled = !!selectedTile;

                return (
                  <motion.button
                    key={`blank-${index}`}
                    type="button"
                    onClick={handleClearSlot}
                    disabled={isDisabled || !isFilled}
                    aria-label={
                      isFilled
                        ? t("completeWordAnswer.clearLetter")
                        : t("completeWordAnswer.emptySlot")
                    }
                    className={`relative min-w-12 sm:min-w-14 h-12 sm:h-14 rounded-xl border-2 flex items-center justify-center overflow-hidden ${
                      isFilled
                        ? "border-secondary bg-secondary/15 cursor-pointer hover:bg-secondary/25"
                        : "border-dashed border-secondary/60 bg-secondary/5 cursor-default"
                    } disabled:cursor-default`}
                    animate={
                      isFilled ? { scale: [1, 1.06, 1] } : { scale: [1, 1.03, 1] }
                    }
                    transition={
                      isFilled
                        ? { duration: 0.18 }
                        : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                    }
                  >
                    <AnimatePresence mode="wait">
                      {isFilled && selectedTile ? (
                        <motion.span
                          key={`placed-${selectedTile.id}`}
                          initial={{ scale: 0.3, opacity: 0, y: 8 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.4, opacity: 0, y: -6 }}
                          transition={springFast}
                          className="font-heading text-2xl sm:text-3xl text-secondary"
                        >
                          {selectedTile.text}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="empty-slot"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 0.5, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={tweenFast}
                          className="font-heading text-xl sm:text-2xl text-secondary/70"
                        >
                          ?
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </span>
          )}

          {parsed.after && <span>{parsed.after}</span>}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {tiles.map((tile, index) => {
          const isSelected = selectedChoice === tile.id;

          return (
            <motion.button
              key={tile.id}
              type="button"
              onClick={() => handleTileSelect(tile.id)}
              disabled={isDisabled}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.05 : 1,
                y: 0,
              }}
              transition={{ ...springFast, delay: index * 0.02 }}
              whileHover={
                !isDisabled && !isSelected
                  ? { scale: 1.06, y: -2 }
                  : undefined
              }
              whileTap={!isDisabled ? { scale: 0.94 } : undefined}
              className={`min-w-14 h-14 sm:min-w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-secondary bg-secondary text-white shadow-warm ring-2 ring-secondary/40 ring-offset-2"
                  : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5 shadow-sm"
              }`}
            >
              <span className="font-heading text-xl sm:text-2xl">
                {tile.text}
              </span>
            </motion.button>
          );
        })}
      </div>

      <Button
        variant="secondary"
        onClick={onSubmit}
        disabled={!selectedChoice || isDisabled}
        className="w-full mt-2 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base"
      >
        {t("submitAnswer")}
      </Button>
    </div>
  );
};

export default CompleteWordAnswer;
