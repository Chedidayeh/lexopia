"use client";

import { useMemo } from "react";
import { TabsContent } from "@/src/components/ui/tabs";
import RiddlesStats from "./RiddlesStats";
import { ChildProfile } from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import { getChallengeAnalytics } from "../_lib/challenge-analytics";
import { motion } from "framer-motion";

interface RiddleAnalyticsTabProps {
  selectedChild: ChildProfile | undefined;
}

export default function RiddleAnalyticsTab({
  selectedChild,
}: RiddleAnalyticsTabProps) {
  const t = useTranslations("ParentDashboard");
  const { isRTL, locale } = useLocale();

  const analytics = useMemo(
    () => getChallengeAnalytics(selectedChild, locale),
    [selectedChild, locale],
  );

  const childName =
    selectedChild?.child?.name ?? selectedChild?.name ?? t("unknown");

  if (!selectedChild) {
    return (
      <TabsContent value="riddle-analytics" className="space-y-4 md:space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          {t("loading", { defaultValue: "Loading child data..." })}
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent
      dir={isRTL ? "rtl" : "ltr"}
      value="riddle-analytics"
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl p-4 md:p-6 border border-black/10">
        <div>
          <h2 className="font-heading text-xl md:text-3xl text-foreground mb-2">
            {t("riddleStatistics.title")}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t("riddleStatistics.description", { childName })}
          </p>
        </div>
      </div>

      {!analytics.hasAttempts && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-linear-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-4 md:p-6 border border-violet-200/50 dark:border-violet-800/50"
        >
          <h3 className="font-heading text-lg md:text-xl text-violet-900 dark:text-violet-100">
            {t("riddleStatistics.gettingStartedTitle")}
          </h3>
          <p className="text-sm md:text-sm text-violet-800 dark:text-violet-200 mt-2">
            {t("riddleStatistics.gettingStartedDescription", { childName })}
          </p>
        </motion.div>
      )}

      <RiddlesStats
        childProgress={selectedChild.progress ?? []}
        stories={selectedChild.stories ?? []}
        analytics={analytics}
      />
    </TabsContent>
  );
}
