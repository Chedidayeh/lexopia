"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Globe2,
  GraduationCap,
  Loader2,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { getChildReadingPlanAction } from "@/src/lib/reading-plan/server-actions";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import { useLocale } from "@/src/contexts/LocaleContext";
import { READING_LEVELS } from "@/src/lib/onboarding/constants";
import {
  countCompletedStories,
  findPrimaryStoryAction,
  getStoryDisplayTitle,
  planHasPendingContent,
} from "../../_lib/reading-plan-helpers";
import StoryEpisodeCard from "./StoryEpisodeCard";

interface ReadingPlanContentProps {
  childId: string;
  childName: string;
  initialPlan: ReadingPlanDetailView | null;
  showBackLink?: boolean;
}

function PlanStateMessage({
  icon,
  title,
  description,
  tone = "muted",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "muted" | "blue" | "red";
}) {
  const toneClasses = {
    muted: "border-black/10 bg-card",
    blue: "border-blue-200/50 dark:border-blue-800/50 bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30",
    red: "border-red-200/50 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30",
  };

  return (
    <div className={`rounded-2xl border p-6 md:p-8 ${toneClasses[tone]}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-heading text-xl md:text-2xl text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReadingPlanContent({
  childId,
  childName,
  initialPlan,
  showBackLink = true,
}: ReadingPlanContentProps) {
  const t = useTranslations("ChildDashboard");
  const tOnboarding = useTranslations("Onboarding");
  const { isRTL } = useLocale();

  const [plan, setPlan] = useState<ReadingPlanDetailView | null>(initialPlan);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(
    initialPlan?.roadmaps[0]?.id ?? null,
  );

  const fetchPlan = useCallback(async () => {
    const result = await getChildReadingPlanAction(childId);
    setPlan(result?.plan ?? null);
    if (result?.plan?.roadmaps[0] && !activeRoadmapId) {
      setActiveRoadmapId(result.plan.roadmaps[0].id);
    }
  }, [activeRoadmapId, childId]);

  useEffect(() => {
    setPlan(initialPlan);
    if (initialPlan?.roadmaps[0]) {
      setActiveRoadmapId(initialPlan.roadmaps[0].id);
    }
  }, [initialPlan]);

  useEffect(() => {
    if (!plan || !planHasPendingContent(plan)) return;
    const interval = setInterval(() => void fetchPlan(), 5000);
    return () => clearInterval(interval);
  }, [plan, fetchPlan]);

  const primaryStory = useMemo(
    () => (plan ? findPrimaryStoryAction(plan) : null),
    [plan],
  );

  const completedCount = plan ? countCompletedStories(plan) : 0;
  const progressPercent =
    plan && plan.totalStories > 0
      ? Math.round((completedCount / plan.totalStories) * 100)
      : 0;

  const activeRoadmap = plan?.roadmaps.find((r) => r.id === activeRoadmapId);

  const readingLevelEntry =
    plan &&
    READING_LEVELS.find((level) => level.value === plan.readingLevel);

  const readingLevelLabel = readingLevelEntry
    ? tOnboarding(readingLevelEntry.labelKey)
    : null;

  if (!plan) {
    return (
      <PlanStateMessage
        icon={<Sparkles className="h-6 w-6 text-muted-foreground shrink-0" />}
        title={t("readingPlan.noPlanTitle")}
        description={t("readingPlan.noPlanDescription", { childName })}
      />
    );
  }

  if (plan.status === "GENERATING") {
    return (
      <PlanStateMessage
        icon={
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 shrink-0" />
        }
        title={t("readingPlan.generatingTitle")}
        description={t("readingPlan.generatingDescription", { childName })}
        tone="blue"
      />
    );
  }

  if (plan.status === "FAILED") {
    return (
      <PlanStateMessage
        icon={<Sparkles className="h-6 w-6 text-red-600 shrink-0" />}
        title={t("readingPlan.failedTitle")}
        description={t("readingPlan.failedDescription")}
        tone="red"
      />
    );
  }

  return (
    <div className="space-y-6 md:space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {showBackLink && (
        <Button variant="ghost" size="sm" className="gap-2 -ms-2" asChild>
          <Link href={`/child-dashboard/${childId}`}>
            <ArrowLeft className="h-4 w-4" />
            {t("readingPlanPage.backToDashboard")}
          </Link>
        </Button>
      )}

      <div className="rounded-2xl border border-black/10 bg-linear-to-br from-primary/10 via-card to-secondary/10 p-6 md:p-8 shadow-warm-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Map className="h-6 w-6 text-primary shrink-0" />
              <h1 className="font-heading text-2xl md:text-4xl text-foreground">
                {t("readingPlanPage.title")}
              </h1>
              <Badge variant="outline">
                {t("readingPlanPage.planVersion", { number: plan.planNumber })}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {t("readingPlanPage.subtitle", { childName })}
            </p>
            {plan.sourceInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {plan.sourceInterests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {tOnboarding(`interests.${interest}`, {
                      defaultValue: interest,
                    })}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 w-full lg:w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("readingPlanPage.overallProgress")}
              </span>
              <span className="font-medium">
                {completedCount}/{plan.totalStories}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {t("readingPlan.storyProgress", {
                ready: plan.readyStories,
                total: plan.totalStories,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: Target,
            label: t("readingPlanPage.stats.completed"),
            value: String(completedCount),
            color: "text-green-600",
          },
          {
            icon: BookOpen,
            label: t("readingPlanPage.stats.ready"),
            value: `${plan.readyStories}/${plan.totalStories}`,
            color: "text-blue-600",
          },
          {
            icon: CalendarDays,
            label: t("readingPlanPage.stats.weeklyGoal"),
            value: t("readingPlanPage.stats.storiesPerWeek", {
              count: plan.storiesPerWeek,
            }),
            color: "text-violet-600",
          },
          {
            icon: Clock,
            label: t("readingPlanPage.stats.sessionLength"),
            value: t("readingPlanPage.stats.minutes", {
              count: plan.sessionDurationMins,
            }),
            color: "text-orange-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/10 bg-card p-4 shadow-warm"
          >
            <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="font-heading text-lg md:text-xl font-semibold mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {readingLevelLabel && (
        <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-muted/30 px-4 py-3 text-sm">
          <GraduationCap className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            {t("readingPlanPage.readingLevel")}
          </span>
          <span className="font-medium">{readingLevelLabel}</span>
        </div>
      )}

      {primaryStory && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-primary/30 bg-linear-to-r from-primary/15 via-primary/5 to-transparent p-6 md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {primaryStory.access.kind === "continue"
              ? t("readingPlan.continueReading")
              : t("readingPlan.upNext")}
          </p>
          <h2 className="font-heading text-2xl md:text-3xl text-foreground mt-2">
            {getStoryDisplayTitle(primaryStory.story)}
          </h2>
          <p className="text-muted-foreground mt-2">
            {primaryStory.world.name}
            {primaryStory.story.episodeNumber != null && (
              <>
                {" · "}
                {t("readingPlan.episodeLabel", {
                  number: primaryStory.story.episodeNumber,
                })}
              </>
            )}
          </p>
          <Button size="lg" className="mt-5" asChild>
            <Link
              href={`/story-reading-interface/${primaryStory.story.id}?childId=${childId}`}
            >
              <BookOpen className="h-4 w-4 me-2" />
              {primaryStory.access.kind === "continue"
                ? t("readingPlan.continueReading")
                : t("readingPlan.startReading")}
            </Link>
          </Button>
        </motion.div>
      )}

      <div className="space-y-4">
        <h2 className="font-heading text-xl md:text-2xl text-foreground">
          {t("readingPlanPage.roadmapsTitle")}
        </h2>

        {plan.roadmaps.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {plan.roadmaps.map((roadmap) => (
              <Button
                key={roadmap.id}
                variant={activeRoadmapId === roadmap.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveRoadmapId(roadmap.id)}
              >
                {roadmap.title ||
                  tOnboarding(`interests.${roadmap.interest}`, {
                    defaultValue: roadmap.interest,
                  })}
              </Button>
            ))}
          </div>
        )}

        {activeRoadmap && (
          <div className="rounded-2xl border border-black/10 bg-card p-5 md:p-6 shadow-warm-lg space-y-6">
            <div>
              <h3 className="font-heading text-lg md:text-xl text-foreground">
                {activeRoadmap.title ||
                  tOnboarding(`interests.${activeRoadmap.interest}`, {
                    defaultValue: activeRoadmap.interest,
                  })}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("readingPlan.worldCount", {
                  count: activeRoadmap.worlds.length,
                })}
              </p>
            </div>

            {activeRoadmap.worlds.map((world) => (
              <div
                key={world.id}
                className="rounded-xl border border-black/10 bg-background/80 p-4 md:p-5"
              >
                <div className="flex items-start gap-3 mb-5 pb-4 border-b border-black/10">
                  <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                    <Globe2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading text-lg text-foreground">
                      {world.name}
                    </h4>
                    {world.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {world.description}
                      </p>
                    )}
                    {world.storyArc && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {world.storyArc.title}
                        {world.storyArc.synopsis
                          ? ` — ${world.storyArc.synopsis}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ps-1">
                  {[...world.stories]
                    .sort((a, b) => a.order - b.order)
                    .map((story, index, sorted) => (
                      <StoryEpisodeCard
                        key={story.id}
                        childId={childId}
                        story={story}
                        world={world}
                        previousStory={index > 0 ? sorted[index - 1] : null}
                        index={index}
                        isLast={index === sorted.length - 1}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!primaryStory && plan.readyStories === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("readingPlan.waitingForFirstStory", { childName })}
          </p>
        )}
      </div>
    </div>
  );
}
