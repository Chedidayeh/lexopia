"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TabsContent } from "@/src/components/ui/tabs";
import BadgeCard from "./BadgeCard";
import { Badge, ChildProfile } from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import { getAchievementStats } from "../_lib/achievements";
import { StarIcon } from "lucide-react";

interface AchievementsTabProps {
  selectedChild: ChildProfile | undefined;
  allAvailableBadges?: Badge[];
}

export default function AchievementsTab({
  selectedChild,
  allAvailableBadges,
}: AchievementsTabProps) {
  const t = useTranslations("ParentDashboard");
  const { isRTL } = useLocale();

  const stats = useMemo(
    () => getAchievementStats(selectedChild, allAvailableBadges ?? []),
    [selectedChild, allAvailableBadges],
  );

  const childName =
    selectedChild?.child?.name ?? selectedChild?.name ?? t("unknown");

  return (
    <TabsContent
      dir={isRTL ? "rtl" : "ltr"}
      value="achievements"
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl p-4 md:p-6 border border-black/10">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-heading text-xl md:text-3xl text-foreground mb-2">
              {t("achievements.title")}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("achievements.unlockedSummary", {
                unlocked: String(stats.unlockedCount),
                total: String(stats.totalCount),
                plural: stats.totalCount !== 1 ? "s" : "",
                childName,
              })}
            </p>
          </div>

          {stats.totalCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-black/10 bg-card p-3">
                <p className="text-xs text-muted-foreground">
                  {t("achievements.currentLevel")}
                </p>
                <p className="text-sm font-medium mt-1">
                  {t("achievements.levelLabel", {
                    level: stats.currentLevel,
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-black/10 bg-card p-3">
                <p className="text-xs text-muted-foreground">
                  {t("stats.totalStars")}
                </p>
                <p className="text-sm font-medium mt-1 flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  {stats.totalStars}
                </p>
              </div>
              <div className="rounded-lg border border-black/10 bg-card p-3">
                <p className="text-xs text-muted-foreground">
                  {t("achievements.nextBadge")}
                </p>
                <p className="text-sm font-medium mt-1">
                  {stats.nextBadge
                    ? t("achievements.starsToGo", {
                        stars: stats.starsToNextBadge,
                      })
                    : t("achievements.allUnlocked")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!stats.hasNoBadgeCatalog && !stats.hasAnyUnlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-linear-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-4 md:p-6 border border-violet-200/50 dark:border-violet-800/50"
        >
          <h3 className="font-heading text-lg md:text-xl text-violet-900 dark:text-violet-100">
            {t("achievements.gettingStartedTitle")}
          </h3>
          <p className="text-sm md:text-sm text-violet-800 dark:text-violet-200 mt-2">
            {t("achievements.gettingStartedDescription", { childName })}
          </p>
        </motion.div>
      )}

      {stats.hasNoBadgeCatalog ? (
        <div className="rounded-xl bg-card border border-black/30 p-12 shadow-warm-lg text-center">
          <p className="text-2xl mb-2">{t("achievements.emptyTitle")}</p>
          <p className="text-muted-foreground">
            {t("achievements.emptyMessage")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.displayBadges.map((badge, index) => {
            const isUnlocked = stats.unlockedBadgeIds.has(badge.id);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                index={index}
                isLocked={!isUnlocked}
                showDetails={isUnlocked}
                totalStars={stats.totalStars}
              />
            );
          })}
        </div>
      )}
    </TabsContent>
  );
}
