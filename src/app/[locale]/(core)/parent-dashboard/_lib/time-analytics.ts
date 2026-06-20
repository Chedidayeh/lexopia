import type { ChildProfile } from "@Lexopia/shared-types";
import {
  calculateTimeEntries,
  filterTimeEntriesByRange,
  fillTimeEntriesGaps,
  getAverageReadingTimePerDay,
  getCurrentStreak,
  getDateRangePresets,
  getReadingActivityRate,
  getTotalReadingTime,
  hasChildReadingActivity,
  type TimeEntry,
  type TimeRange,
} from "./stats";

export type TimeAnalyticsData = {
  timeEntries: TimeEntry[];
  filledTimeEntries: TimeEntry[];
  allTime: {
    totalMinutes: number;
    avgMinutesPerDay: number;
    currentStreak: number;
    activityRate: ReturnType<typeof getReadingActivityRate>;
    storiesWithReading: number;
  };
  period: {
    totalMinutes: number;
    avgMinutesPerDay: number;
    daysWithReading: number;
  };
  hasReadingActivity: boolean;
  joiningDate: Date;
};

export function getUniqueStoriesWithReading(
  profile: ChildProfile | undefined,
): number {
  if (!profile?.progress?.length) {
    return 0;
  }

  const storyIds = new Set<string>();
  for (const progress of profile.progress) {
    if (!progress.storyId) continue;

    const hasCheckpoints = progress.gameSession?.checkpoints?.some(
      (checkpoint) => checkpoint.pausedAt,
    );
    const hasTime = (progress.totalTimeSpent ?? 0) > 0;

    if (hasCheckpoints || hasTime) {
      storyIds.add(progress.storyId);
    }
  }

  return storyIds.size;
}

export function getDefaultTimeRange(
  createdAt: Date | string | undefined,
  label: string,
): TimeRange {
  const presets = getDateRangePresets();
  const preset = presets.last3Days;
  const joiningDate = createdAt ? new Date(createdAt) : new Date();
  joiningDate.setHours(0, 0, 0, 0);

  const startDate =
    preset.startDate < joiningDate ? joiningDate : preset.startDate;

  return {
    startDate,
    endDate: preset.endDate,
    label,
  };
}

export function formatTimeEntryDate(
  dateStr: string,
  locale?: string,
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function getPeriodStats(entries: TimeEntry[]) {
  const daysWithReading = entries.filter((entry) => entry.minutes > 0).length;
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const avgMinutesPerDay =
    daysWithReading > 0 ? Math.round(totalMinutes / daysWithReading) : 0;

  return {
    totalMinutes,
    avgMinutesPerDay,
    daysWithReading,
  };
}

export function getTimeAnalytics(
  profile: ChildProfile | undefined,
  dateRange: TimeRange,
): TimeAnalyticsData {
  const progress = profile?.progress ?? [];
  const timeEntries = calculateTimeEntries(progress);
  const filtered = filterTimeEntriesByRange(
    timeEntries,
    dateRange.startDate,
    dateRange.endDate,
  );
  const filledTimeEntries = fillTimeEntriesGaps(
    filtered,
    dateRange.startDate,
    dateRange.endDate,
  );

  const joiningDate = profile?.createdAt
    ? new Date(profile.createdAt)
    : new Date();
  joiningDate.setHours(0, 0, 0, 0);

  return {
    timeEntries,
    filledTimeEntries,
    allTime: {
      totalMinutes: getTotalReadingTime(profile),
      avgMinutesPerDay: getAverageReadingTimePerDay(profile),
      currentStreak: getCurrentStreak(profile),
      activityRate: getReadingActivityRate(profile),
      storiesWithReading: getUniqueStoriesWithReading(profile),
    },
    period: getPeriodStats(filtered),
    hasReadingActivity: hasChildReadingActivity(profile),
    joiningDate,
  };
}
