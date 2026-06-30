"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";

interface LetterTile {
  id: string;
  text: string;
}

interface LetterTilesAnswerProps {
  prompt?: string | null;
  tiles: LetterTile[];
  selectedChoice: string | null;
  onSelect: (choiceId: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}

const LetterTilesAnswer = ({
  prompt,
  tiles,
  selectedChoice,
  onSelect,
  onSubmit,
  isDisabled,
}: LetterTilesAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  return (
    <div className="space-y-4 sm:space-y-6">
      <label className="block font-body font-medium text-foreground text-lg">
        {t("letterTilesAnswer.instructions")}
      </label>

      {prompt && (
        <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 p-4 sm:p-6 text-center">
          <p className="font-heading text-2xl md:text-3xl tracking-widest text-foreground">
            {prompt}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {tiles.map((tile) => {
          const isSelected = selectedChoice === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelect(tile.id)}
              disabled={isDisabled}
              className={`min-w-14 h-14 sm:min-w-16 sm:h-16 rounded-xl border-2 transition-smooth flex items-center justify-center ${
                isSelected
                  ? "border-secondary bg-secondary text-white shadow-warm"
                  : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="font-heading text-xl sm:text-2xl">
                {tile.text}
              </span>
            </button>
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

export default LetterTilesAnswer;
