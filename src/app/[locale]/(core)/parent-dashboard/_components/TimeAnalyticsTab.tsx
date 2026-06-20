"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TabsContent } from "@/src/components/ui/tabs";
import TimeAnalytics from "./TimeAnalytics";
import { ChildProfile } from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  getDefaultTimeRange,
  getTimeAnalytics,
} from "../_lib/time-analytics";

interface TimeAnalyticsTabProps {
  selectedChild: ChildProfile | undefined;
}

function TimeAnalyticsTabContent({
  selectedChild,
}: {
  selectedChild: ChildProfile;
}) {
  const t = useTranslations("ParentDashboard");
  const { isRTL } = useLocale();

  const defaultRange = useMemo(
    () =>
      getDefaultTimeRange(
        selectedChild.createdAt,
        t("timeAnalytics.presets.last3Days"),
      ),
    [selectedChild.createdAt, t],
  );

  const [dateRange, setDateRange] = useState(defaultRange);

  const analytics = useMemo(
    () => getTimeAnalytics(selectedChild, dateRange),
    [selectedChild, dateRange],
  );

  const childName =
    selectedChild.child?.name ?? selectedChild.name ?? t("unknown");

  return (
    <TabsContent
      dir={isRTL ? "rtl" : "ltr"}
      value="time-analytics"
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl p-4 md:p-6 border border-black/10">
        <div>
          <h2 className="font-heading text-xl md:text-3xl text-foreground mb-2">
            {t("timeAnalytics.title")}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t("timeAnalytics.description", { childName })}
          </p>
        </div>
      </div>

      {!analytics.hasReadingActivity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-linear-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-4 md:p-6 border border-blue-200/50 dark:border-blue-800/50"
        >
          <h3 className="font-heading text-lg md:text-xl text-blue-900 dark:text-blue-100">
            {t("timeAnalytics.gettingStartedTitle")}
          </h3>
          <p className="text-sm md:text-sm text-blue-800 dark:text-blue-200 mt-2">
            {t("timeAnalytics.gettingStartedDescription", { childName })}
          </p>
        </motion.div>
      )}

      <TimeAnalytics
        analytics={analytics}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </TabsContent>
  );
}

export default function TimeAnalyticsTab({
  selectedChild,
}: TimeAnalyticsTabProps) {
  const t = useTranslations("ParentDashboard");

  if (!selectedChild) {
    return (
      <TabsContent value="time-analytics" className="space-y-4 md:space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          {t("loading", { defaultValue: "Loading child data..." })}
        </div>
      </TabsContent>
    );
  }

  return (
    <TimeAnalyticsTabContent
      key={selectedChild.id}
      selectedChild={selectedChild}
    />
  );
}
