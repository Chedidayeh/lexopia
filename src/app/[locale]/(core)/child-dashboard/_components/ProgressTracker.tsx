"use client";

import { useTranslations } from "next-intl";

interface ProgressTrackerProps {
  currentStars: number;
}

const ProgressTracker = ({ currentStars }: ProgressTrackerProps) => {
  const t = useTranslations("ChildDashboard");

  return (
    <div className="h-full rounded-2xl bg-gradient-to-b from-card via-card to-card/95 p-6 shadow-warm-lg border border-black/30 flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl md:text-3xl text-foreground">
          {t("progressTracker.title")}
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          {t("progressTracker.motivation.default")}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative bg-primary rounded-full w-24 h-24 flex items-center justify-center">
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-semibold text-white">{currentStars}</span>
            <span className="text-xs text-gray-100 font-data">
              {t("progressTracker.totalStarsLabel")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
