/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import StatsCards from "./StatsCards";
import ChildSettingsModal from "./ChildSettingsModal";
import { ChildProfile, RoleType } from "@Lexopia/shared-types";
import { getOverviewStats } from "../_lib/stats";
import { READING_LEVELS } from "@/src/lib/onboarding/constants";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/src/contexts/LocaleContext";
import { Link } from "@/src/i18n/navigation";

interface OverviewTabProps {
  parentName?: string;
  selectedChild: ChildProfile | undefined;
  handleChildAdded: () => void;
  userRole: RoleType;
}

export default function OverviewTab({
  parentName,
  selectedChild,
  handleChildAdded,
  userRole,
}: OverviewTabProps) {
  const t = useTranslations("ParentDashboard");
  const tOnboarding = useTranslations("Onboarding");
  const [showChildSettings, setShowChildSettings] = useState(false);
  const { isRTL } = useLocale();

  const [notificationToggle, setNotificationToggle] = useState(
    selectedChild?.activateNotifications,
  );

  useEffect(() => {
    setNotificationToggle(selectedChild?.activateNotifications);
  }, [selectedChild?.activateNotifications, selectedChild?.id]);

  const stats = useMemo(
    () => getOverviewStats(selectedChild),
    [selectedChild],
  );

  const readingLevelLabel = selectedChild?.readingLevel
    ? READING_LEVELS.find((level) => level.value === selectedChild.readingLevel)
        ?.labelKey
    : null;

  const childName = selectedChild?.child?.name || selectedChild?.name || "";

  return (
    <>
      <TabsContent
        dir={isRTL ? "rtl" : "ltr"}
        value="overview"
        className="space-y-4 md:space-y-6"
      >
        <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl p-4 md:p-6 border border-black/10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div>
              <h2 className="font-heading text-xl md:text-3xl text-foreground">
                {t("overview.welcome", { name: parentName || "Parent" })}
              </h2>
              <p className="text-sm md:text-sm text-muted-foreground mt-2">
                {t("overview.description", {
                  childName: selectedChild?.child?.name || "",
                })}
              </p>
            </div>
            {selectedChild?.childId && (
              <Link
                target="_blank"
                href={`/child-dashboard/${selectedChild.childId}`}
                className="w-full md:w-auto"
              >
                <Button className="whitespace-nowrap w-full md:w-auto text-sm md:text-sm">
                  {t("overview.childDashboardButton", {
                    childName: selectedChild.child?.name || "Child",
                  })}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {selectedChild && !stats.hasReadingActivity && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 md:p-6 border border-blue-200/50 dark:border-blue-800/50"
          >
            <h3 className="font-heading text-lg md:text-xl text-blue-900 dark:text-blue-100">
              {t("overview.gettingStartedTitle")}
            </h3>
            <p className="text-sm md:text-sm text-blue-800 dark:text-blue-200 mt-2">
              {t("overview.gettingStartedDescription", { childName })}
            </p>
            {selectedChild.storiesPerWeek && (
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mt-3">
                {t("overview.readingGoal", {
                  storiesPerWeek: selectedChild.storiesPerWeek,
                  sessionDurationMins: selectedChild.sessionDurationMins || 15,
                })}
              </p>
            )}
          </motion.div>
        )}

        {selectedChild?.readingLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-black/10 bg-card p-3">
              <p className="text-xs text-muted-foreground">
                {t("overview.readingLevel")}
              </p>
              <p className="text-sm font-medium mt-1">
                {readingLevelLabel
                  ? tOnboarding(readingLevelLabel)
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-card p-3">
              <p className="text-xs text-muted-foreground">{t("overview.age")}</p>
              <p className="text-sm font-medium mt-1">
                {selectedChild.age
                  ? t("overview.ageValue", { age: selectedChild.age })
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-card p-3">
              <p className="text-xs text-muted-foreground">
                {t("overview.weeklyGoal")}
              </p>
              <p className="text-sm font-medium mt-1">
                {t("overview.weeklyGoalValue", {
                  stories: selectedChild.storiesPerWeek || 3,
                })}
              </p>
            </div>
          </div>
        )}

        {selectedChild?.dailyActivity?.lastActiveAt &&
          stats.showInactivityReminder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-linear-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 md:p-6 border border-amber-200/50 dark:border-amber-800/50"
            >
              <div className="flex flex-col gap-3">
                <h3 className="font-heading text-lg md:text-xl text-amber-900 dark:text-amber-100">
                  {t("inactivityReminder.title")}
                </h3>
                <p className="text-sm md:text-sm text-amber-800 dark:text-amber-200">
                  {t("inactivityReminder.description", {
                    childName: childName || "your child",
                    daysSince: stats.daysSinceLastRead || 0,
                    daysLabel:
                      (stats.daysSinceLastRead || 0) === 1
                        ? t("stats.day")
                        : t("stats.days"),
                    storiesPerWeek: selectedChild?.storiesPerWeek || 3,
                    daysBetweenStories:
                      Math.round(
                        (7 / (selectedChild?.storiesPerWeek || 3)) * 10,
                      ) / 10,
                  })}
                </p>
                <div className="mt-2">
                  <p className="text-xs md:text-sm font-medium text-amber-900 dark:text-amber-100">
                    {t("inactivityReminder.weeklyProgress", {
                      storiesThisWeek: stats.weeklyProgress.storiesThisWeek,
                      storiesNeeded: stats.weeklyProgress.storiesNeeded,
                      percentage: stats.weeklyProgress.percentage,
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        <StatsCards
          totalStars={stats.totalStars}
          storiesCompleted={stats.storiesCompleted}
          totalReadingTime={stats.totalReadingTime}
          riddlesSolved={stats.challengesSolved}
          averagePerDay={stats.averagePerDay}
          currentStreak={stats.currentStreak}
        />

        {userRole === RoleType.PARENT && (
          <div className="bg-linear-to-r bg-primary/5 rounded-xl py-2 px-4 border border-black/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div>
                <h2 className="font-heading text-sm md:text-xl text-foreground">
                  {t("notificationSettings.statusMessagePrefix", {
                    childName: childName || "your child",
                  })}{" "}
                  <span
                    className={` font-medium inline-block ${
                      notificationToggle
                        ? " text-green-700 dark:text-green-200"
                        : " text-amber-700 dark:text-amber-200"
                    }`}
                  >
                    {notificationToggle
                      ? t("notificationSettings.enabledStatus")
                      : t("notificationSettings.disabledStatus")}
                  </span>
                </h2>
                <p className="text-sm md:text-sm text-muted-foreground mt-2">
                  {t("notificationSettings.settingsDescription")}
                </p>
              </div>
              <Button
                variant={"outline"}
                onClick={() => setShowChildSettings(true)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {t("childSettings.title") || "Child Settings"}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      <ChildSettingsModal
        isOpen={showChildSettings}
        onClose={() => setShowChildSettings(false)}
        selectedChild={selectedChild}
        notificationToggle={notificationToggle}
        setNotificationToggle={setNotificationToggle}
        handleChildAdded={handleChildAdded}
      />
    </>
  );
}
