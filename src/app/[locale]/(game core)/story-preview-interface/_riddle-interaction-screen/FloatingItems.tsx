"use client";

import { Lightbulb, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface FloatingItemsProps {
  attempts: number;
  hintsUsed: number;
  totalHints: number;
}

const FloatingItems = ({
  attempts,
  hintsUsed,
  totalHints,
}: FloatingItemsProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  return (
    <div className="fixed top-20 md:top-24 left-2 sm:left-3 md:left-4 lg:left-8 z-50 flex md:flex-col  items-end gap-2 sm:gap-3 pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3 bg-card/90 backdrop-blur-md rounded-full px-2 sm:px-3 py-1.5 sm:py-2 shadow-warm pointer-events-auto">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <PencilIcon size={16} className="sm:size-5 text-primary" />
        </div>
        <div className="text-right">
          <p className="font-caption text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
            {t("floatingItems.attemptsLabel")}
          </p>
          <p className="font-data text-base sm:text-lg font-bold text-foreground">
            {attempts}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 bg-card/90 backdrop-blur-md rounded-full px-2 sm:px-3 py-1.5 sm:py-2 shadow-warm pointer-events-auto">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Lightbulb size={16} className="sm:size-5 text-secondary" />
        </div>
        <div className="text-right">
          <p className="font-caption text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">
            {t("floatingItems.hintsUsedLabel")}
          </p>
          <p className="font-data text-base sm:text-lg font-bold text-foreground">
            {hintsUsed}/{totalHints}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FloatingItems;