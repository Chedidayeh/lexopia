"use client";

import {
  BookOpen,
  Clock,
  StarIcon,
  TrophyIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Badge } from "@/src/lib/dashboard/types";
import { useTranslations } from "next-intl";

interface WelcomeBannerProps {
  childName: string;
  avatar: string | undefined;
  isNewReader: boolean;
  totalStars: number;
  storiesCompleted: number;
  readingTimeMinutes: number;
  recentBadges: Badge[];
  readingTimeSubtitle?: string;
}

const WelcomeBanner = ({
  childName,
  avatar,
  isNewReader,
  totalStars,
  storiesCompleted,
  readingTimeMinutes,
  recentBadges,
  readingTimeSubtitle,
}: WelcomeBannerProps) => {
  const t = useTranslations("ChildDashboard");
  return (
    <div className="rounded-xl bg-card border border-black/10 p-4 lg:p-6 shadow-warm-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        {/* Avatar */}
        <div className="flex justify-center lg:justify-start">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.36, ease: "anticipate" }}
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 border-primary shadow-warm hover:scale-105 transition-transform duration-100 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0"
          >
            {avatar ? (
              <img
                src={avatar}
                alt={"Avatar of " + childName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl lg:text-4xl font-heading font-bold text-primary">
                {childName.charAt(0).toUpperCase()}
              </span>
            )}
          </motion.div>
        </div>

        {/* Welcome Message */}
        <div className="flex-1 text-center lg:text-left">
          {/* Heading with Badge */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl text-foreground">
              {isNewReader
                ? t("welcomeBanner.greetingNew", { childName })
                : t("welcomeBanner.greetingBack", { childName })}
            </h1>
            {recentBadges.length > 0 && (
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-2 p-2 px-3 lg:px-4 bg-accent hover:bg-accent/70 text-white rounded-full text-sm lg:text-base w-fit mx-auto lg:mx-0"
              >
                <TrophyIcon size={18} className="lg:w-5 lg:h-5" />
                <span className="font-body font-medium line-clamp-1">
                  {recentBadges[recentBadges.length - 1].name}
                </span>
              </motion.div>
            )}
          </div>

          {/* Subtitle */}
          <p className="font-body text-base lg:text-lg text-muted-foreground mb-4 lg:mb-6">
            {isNewReader
              ? t("welcomeBanner.subtitleNew")
              : t("welcomeBanner.subtitleBack")}
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-4">
            {/* Total Stars */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg px-3 lg:px-4 py-2 justify-center sm:justify-start"
            >
              <StarIcon size={18} className="lg:w-5 lg:h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <div className="flex items-center gap-1 lg:gap-2 min-w-0">
                <span className="font-body text-xs lg:text-sm text-muted-foreground truncate">
                  {t("welcomeBanner.stats.stars")}
                </span>
                <span className="font-heading font-medium text-foreground text-sm lg:text-base">
                  {totalStars}
                </span>
              </div>
            </motion.div>

            {/* Stories Completed */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg px-3 lg:px-4 py-2 justify-center sm:justify-start"
            >
              <BookOpen size={18} className="lg:w-5 lg:h-5 text-blue-500 flex-shrink-0" />
              <div className="flex items-center gap-1 lg:gap-2 min-w-0">
                <span className="font-body text-xs lg:text-sm text-muted-foreground truncate">
                  {t("welcomeBanner.stats.stories")}
                </span>
                <span className="font-heading font-medium text-foreground text-sm lg:text-base">
                  {storiesCompleted}
                </span>
              </div>
            </motion.div>

            {/* Reading Time */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg px-3 lg:px-4 py-2 justify-center sm:justify-start"
            >
              <Clock size={18} className="lg:w-5 lg:h-5 text-purple-500 flex-shrink-0" />
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-0 lg:gap-1 min-w-0">
                <span className="font-body text-xs lg:text-sm text-muted-foreground truncate">
                  {t("welcomeBanner.stats.readingTime")}
                </span>
                <span className="font-heading font-medium text-foreground text-sm lg:text-base">
                  {t("welcomeBanner.stats.minutes", { count: readingTimeMinutes })}
                </span>
                {readingTimeSubtitle && (
                  <span className="text-xs text-muted-foreground hidden lg:inline">
                    {readingTimeSubtitle}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
