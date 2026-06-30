"use client";

import { type TimeRange } from "../_lib/stats";
import DateRangePicker from "./DateRangePicker";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  formatTimeEntryDate,
  type TimeAnalyticsData,
} from "../_lib/time-analytics";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/src/components/ui/table";

interface TimeAnalyticsProps {
  analytics: TimeAnalyticsData;
  dateRange: TimeRange;
  onDateRangeChange: (range: TimeRange) => void;
}

export default function TimeAnalytics({
  analytics,
  dateRange,
  onDateRangeChange,
}: TimeAnalyticsProps) {
  const t = useTranslations("ParentDashboard");
  const { locale } = useLocale();

  const { allTime, period, filledTimeEntries } = analytics;
  const { activityRate } = allTime;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-linear-to-br from-pink-200/20 to-rose-200/20 border border-pink-200 dark:border-pink-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("timeAnalytics.stats.totalReadingTime")}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className="text-3xl font-data font-medium text-pink-600">
              {allTime.totalMinutes}
            </p>
            <span className="text-sm text-pink-500">
              {t("timeAnalytics.tableHeaders.minutes")}
            </span>
            <span className="text-sm text-pink-500">
              ({Math.floor(allTime.totalMinutes / 60)}h{" "}
              {allTime.totalMinutes % 60}m)
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-linear-to-br from-violet-200/20 to-purple-200/20 border border-violet-200 dark:border-violet-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("timeAnalytics.stats.averagePerDay")}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className="text-3xl font-data font-medium text-violet-600">
              {allTime.avgMinutesPerDay}
            </p>
            <span className="text-sm text-violet-500">
              {t("timeAnalytics.tableHeaders.minutes")}
            </span>
            <span className="text-sm text-violet-500">
              ({Math.floor(allTime.avgMinutesPerDay / 60)}h{" "}
              {allTime.avgMinutesPerDay % 60}m)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("timeAnalytics.stats.onActiveDays")}
          </p>
        </div>

        <div className="rounded-lg bg-linear-to-br from-cyan-200/20 to-blue-200/20 border border-cyan-200 dark:border-cyan-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("timeAnalytics.stats.currentStreak")}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-data font-medium text-cyan-600">
              {allTime.currentStreak}
            </p>
            <p className="text-sm text-cyan-500">
              {t("timeAnalytics.stats.consecutiveDays")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-card border border-black/30 p-4 shadow-warm-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {t("timeAnalytics.stats.readingActivityRate")}
          </p>
          <p className="text-2xl font-data font-medium text-foreground">
            {activityRate.daysRead}/{activityRate.totalDays}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {t("timeAnalytics.stats.sinceJoining")}
            </span>
            <span className="text-sm font-medium text-green-600">
              {activityRate.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${activityRate.percentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-card border border-black/30 p-4 shadow-warm-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {t("timeAnalytics.stats.totalStoriesRead")}
          </p>
          <p className="text-2xl font-data font-medium text-foreground">
            {allTime.storiesWithReading}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {t("timeAnalytics.stats.storiesWithActivity")}
          </p>
        </div>
      </div>

      <DateRangePicker
        value={dateRange}
        onRangeChange={onDateRangeChange}
        childJoiningDate={analytics.joiningDate}
      />

      <div className="rounded-xl bg-card border border-black/30 p-6 shadow-warm-lg overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="font-heading text-lg text-foreground">
            {t("timeAnalytics.stats.dailyReadingTime")}
          </h3>
          {period.daysWithReading > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("timeAnalytics.stats.periodSummary", {
                minutes: period.totalMinutes,
                days: period.daysWithReading,
              })}
            </p>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("timeAnalytics.tableHeaders.date")}</TableHead>
              <TableHead>{t("timeAnalytics.tableHeaders.minutes")}</TableHead>
              <TableHead>{t("timeAnalytics.tableHeaders.stories")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filledTimeEntries.every((entry) => entry.minutes === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-4"
                >
                  {t("timeAnalytics.noActivityMessage")}
                </TableCell>
              </TableRow>
            ) : (
              filledTimeEntries.map((entry) => (
                <TableRow key={entry.date}>
                  <TableCell className="font-medium">
                    {formatTimeEntryDate(entry.date, locale)}
                  </TableCell>
                  <TableCell>
                    {entry.minutes > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-data">{entry.minutes}</span>
                        <span className="text-sm">
                          {t("timeAnalytics.tableHeaders.minutes")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.floor(entry.minutes / 60)}h{" "}
                          {entry.minutes % 60}m)
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.storiesRead > 0 ? entry.storiesRead : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
