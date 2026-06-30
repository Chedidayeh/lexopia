"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";

interface WordOption {
  id: string;
  text: string;
}

interface FillBlankAnswerProps {
  sentenceTemplate: string;
  wordBank: WordOption[];
  selectedChoice: string | null;
  onSelect: (choiceId: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}

const FillBlankAnswer = ({
  sentenceTemplate,
  wordBank,
  selectedChoice,
  onSelect,
  onSubmit,
  isDisabled,
}: FillBlankAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  const displaySentence = sentenceTemplate.includes("___")
    ? sentenceTemplate.replace(
        "___",
        selectedChoice
          ? `**${wordBank.find((word) => word.id === selectedChoice)?.text ?? "___"}**`
          : "___",
      )
    : sentenceTemplate;

  return (
    <div className="space-y-4 sm:space-y-6">
      <label className="block font-body font-medium text-foreground text-lg">
        {t("fillBlankAnswer.instructions")}
      </label>

      <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 p-4 sm:p-6">
        <p className="font-body text-xl md:text-2xl text-foreground leading-relaxed text-center">
          {displaySentence.split("**").map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="font-heading text-secondary underline">
                {part}
              </span>
            ) : (
              <span key={index}>{part}</span>
            ),
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {wordBank.map((word) => {
          const isSelected = selectedChoice === word.id;
          return (
            <button
              key={word.id}
              type="button"
              onClick={() => onSelect(word.id)}
              disabled={isDisabled}
              className={`p-4 rounded-xl border-2 transition-smooth text-center ${
                isSelected
                  ? "border-secondary bg-secondary/10 shadow-warm"
                  : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center gap-2">
                {isSelected && <CircleCheck size={18} className="text-secondary" />}
                <span className="font-body text-lg text-foreground">{word.text}</span>
              </div>
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

export default FillBlankAnswer;
