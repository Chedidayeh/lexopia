"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  readingTimeSubtitle?: string;
  color: string;
  borderColor: string;
  textColor: string;
  suffix?: string;
  suffixColor?: string;
  subtitle?: string;
}

const StatCard = ({
  icon,
  label,
  value,
  readingTimeSubtitle,
  color,
  borderColor,
  textColor,
  suffix,
  suffixColor,
  subtitle,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      current = increment * stepCount;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl p-4 px-4 h-28 shadow-warm-lg border ${borderColor} ${color} flex flex-col gap-2`}
    >
      {icon && (
        <div className="flex items-center justify-between">
          <span className="text-4xl">{icon}</span>
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className={`text-3xl font-data font-bold ${textColor}`}>
          {displayValue}
        </p>
        {suffix && (
          <span className={`text-sm ${suffixColor || "text-muted-foreground"}`}>
            {suffix}
          </span>
        )}
        {readingTimeSubtitle && (
          <span className={`text-sm ${suffixColor || "text-muted-foreground"}`}>
            {readingTimeSubtitle}
          </span>
        )}
      </div>
      {subtitle && (
        <p className={`text-sm ${textColor.replace("600", "500")}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

interface StatsCardsProps {
  totalStars: number;
  storiesCompleted: number;
  totalReadingTime: number;
  riddlesSolved: number;
  averagePerDay?: number;
  currentStreak?: number;
}

export default function StatsCards({
  totalStars,
  storiesCompleted,
  totalReadingTime,
  riddlesSolved,
  averagePerDay = 0,
  currentStreak = 0,
}: StatsCardsProps) {
  const t = useTranslations("ParentDashboard");
  // Format total reading time to hours
  const hours = Math.floor(totalReadingTime / 60);
  const minutes = totalReadingTime % 60;
  const readingTimeSubtitle =
    minutes > 0 ? `(${hours}h ${minutes}m)` : `(${hours}h)`;

    // format average per day 
    const avgHours = Math.floor(averagePerDay / 60);
    const avgMinutes = averagePerDay % 60;
    const averagePerDaySubtitle =
      avgMinutes > 0 ? `(${avgHours}h ${avgMinutes}m)` : `(${avgHours}h)`;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon=""
          label={t("stats.totalStars")}
          value={totalStars}
          borderColor="border-yellow-200 dark:border-yellow-200/50"
          color="bg-gradient-to-br from-yellow-200/20 to-amber-200/20"
          textColor="text-yellow-600"
        />
        <StatCard
          icon=""
          label={t("stats.storiesCompleted")}
          value={storiesCompleted}
          borderColor="border-blue-200 dark:border-blue-200/50"
          color="bg-gradient-to-br from-blue-200/20 to-cyan-200/20"
          textColor="text-blue-600"
        />
        <StatCard
          icon=""
          label={t("stats.riddlesSolved")}
          value={riddlesSolved}
          borderColor="border-purple-200 dark:border-purple-200/50"
          color="bg-gradient-to-br from-purple-200/20 to-emerald-200/20"
          textColor="text-purple-600"
        />

        <StatCard
          icon=""
          label={t("stats.totalReadingTime")}
          value={totalReadingTime}
          suffix={t("stats.minutes")}
          readingTimeSubtitle={readingTimeSubtitle}
          borderColor="border-pink-200 dark:border-pink-200/50"
          color="bg-linear-to-br from-pink-200/20 to-rose-200/20"
          textColor="text-pink-600"
          suffixColor="text-pink-500"
        />
        <StatCard
          icon=""
          label={t("stats.averagePerDay")}
          value={averagePerDay}
          suffix={t("stats.minutes")}
          readingTimeSubtitle={averagePerDaySubtitle}
          suffixColor="text-green-500"
          borderColor="border-green-200 dark:border-green-200/50"
          color="bg-linear-to-br from-green-200/20 to-green-200/20"
          textColor="text-green-600"
        />
        <StatCard
          icon=""
          label={t("stats.currentStreak")}
          value={currentStreak}
          suffix={currentStreak > 1 ? t("stats.days") : t("stats.day")}
          suffixColor="text-cyan-500"
          borderColor="border-cyan-200 dark:border-cyan-200/50"
          color="bg-linear-to-br from-cyan-200/20 to-cyan-200/20"
          textColor="text-cyan-600"
        />
      </div>
    </>
  );
}
