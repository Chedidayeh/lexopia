'use client';

import { Button } from '@/src/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface TextInputAnswerProps {
  onSubmit: (answer: string) => void;
  isDisabled: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

const TextInputAnswer = ({
  onSubmit,
  isDisabled,
  isLoading = false,
  placeholder,
}: TextInputAnswerProps) => {
    const t = useTranslations("StoryReadingInterface.riddleInterface");
  
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim() && !isDisabled) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <label className="block font-body text-foreground text-base sm:text-lg">
        {t("textInputAnswer.yourAnswer")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled || isLoading}
          placeholder={placeholder || t("textInputAnswer.placeholder")}
          spellCheck={true}
          className="w-full flex-1 px-4 py-2 sm:px-6 sm:py-2 rounded-xl border bg-secondary/10 text-foreground text-base sm:text-lg transition-smooth disabled:opacity-50"
        />
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isDisabled || isLoading}
          variant={"secondary"}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            t("textInputAnswer.checkButton")
          )}
        </Button>
      </div>
    </div>
  );
};

export default TextInputAnswer;