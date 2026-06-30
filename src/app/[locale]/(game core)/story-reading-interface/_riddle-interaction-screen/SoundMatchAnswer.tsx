"use client";

import { useRef, useState } from "react";
import { CircleCheck, Play, Pause } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";

interface SoundChoice {
  id: string;
  text: string;
  audioUrl?: string | null;
}

interface SoundMatchAnswerProps {
  promptAudioUrl?: string;
  choices: SoundChoice[];
  selectedChoice: string | null;
  onSelect: (choiceId: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}

const SoundMatchAnswer = ({
  promptAudioUrl,
  choices,
  selectedChoice,
  onSelect,
  onSubmit,
  isDisabled,
}: SoundMatchAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingChoiceId, setPlayingChoiceId] = useState<string | null>(null);
  const [isPromptPlaying, setIsPromptPlaying] = useState(false);

  const playPrompt = () => {
    if (!audioRef.current || !promptAudioUrl) return;
    if (isPromptPlaying) {
      audioRef.current.pause();
      setIsPromptPlaying(false);
      return;
    }
    audioRef.current.src = promptAudioUrl;
    audioRef.current.play();
    setIsPromptPlaying(true);
  };

  const playChoiceAudio = (choice: SoundChoice) => {
    if (!choice.audioUrl) return;
    if (audioRef.current) {
      audioRef.current.src = choice.audioUrl;
      audioRef.current.play();
      setPlayingChoiceId(choice.id);
      setIsPromptPlaying(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <label className="block font-body font-medium text-foreground text-lg">
        {t("soundMatchAnswer.instructions")}
      </label>

      {promptAudioUrl && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={playPrompt}
            disabled={isDisabled}
            className="flex items-center gap-2"
          >
            {isPromptPlaying ? <Pause size={18} /> : <Play size={18} />}
            {t("soundMatchAnswer.playSound")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {choices.map((choice) => {
          const isSelected = selectedChoice === choice.id;
          return (
            <div
              key={choice.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && onSelect(choice.id)}
              onKeyDown={(event) => {
                if (isDisabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(choice.id);
                }
              }}
              className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer text-left ${
                isSelected
                  ? "border-secondary bg-secondary/10 shadow-warm"
                  : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-secondary bg-secondary"
                      : "border-border bg-input"
                  }`}
                >
                  {isSelected && <CircleCheck size={18} className="text-white" />}
                </div>

                <span className="font-body text-lg text-foreground flex-1">
                  {choice.text}
                </span>

                {choice.audioUrl && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      playChoiceAudio(choice);
                    }}
                    disabled={isDisabled}
                    className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 shrink-0"
                    aria-label={t("soundMatchAnswer.playOption")}
                  >
                    {playingChoiceId === choice.id ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPromptPlaying(false);
          setPlayingChoiceId(null);
        }}
      />

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

export default SoundMatchAnswer;
