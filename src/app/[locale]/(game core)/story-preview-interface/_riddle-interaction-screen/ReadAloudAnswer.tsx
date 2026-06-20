"use client";

import VoiceInputAnswer from "./VoiceInputAnswer";
import { useTranslations } from "next-intl";

interface ReadAloudAnswerProps {
  targetWord?: string | null;
  onSubmit: (transcript: string) => void;
  isDisabled: boolean;
  isLoading?: boolean;
  languageCode?: string;
}

const ReadAloudAnswer = ({
  targetWord,
  onSubmit,
  isDisabled,
  isLoading = false,
  languageCode = "en",
}: ReadAloudAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  return (
    <div className="space-y-4 sm:space-y-6">
      {targetWord && (
        <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 p-4 sm:p-6 text-center">
          <p className="font-body text-sm text-muted-foreground mb-2">
            {t("readAloudAnswer.readThisWord")}
          </p>
          <p className="font-heading text-3xl sm:text-4xl text-foreground">
            {targetWord}
          </p>
        </div>
      )}

      <VoiceInputAnswer
        onSubmit={onSubmit}
        isDisabled={isDisabled}
        isLoading={isLoading}
        languageCode={languageCode}
      />
    </div>
  );
};

export default ReadAloudAnswer;
