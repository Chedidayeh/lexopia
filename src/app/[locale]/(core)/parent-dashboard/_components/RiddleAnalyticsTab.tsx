"use client";

import { useEffect, useMemo, useState } from "react";
import { TabsContent } from "@/src/components/ui/tabs";
import RiddlesStats from "./RiddlesStats";
import { ChildProfile } from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import { getChallengeAnalytics } from "../_lib/challenge-analytics";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  getChildReadingPlanByIdAction,
  getChildReadingPlansAction,
} from "@/src/lib/reading-plan/server-actions";
import type { ReadingPlanSummary } from "@/src/lib/reading-plan/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface RiddleAnalyticsTabProps {
  selectedChild: ChildProfile | undefined;
}

export default function RiddleAnalyticsTab({
  selectedChild,
}: RiddleAnalyticsTabProps) {
  const t = useTranslations("ParentDashboard");
  const { isRTL, locale } = useLocale();

  const [readingPlans, setReadingPlans] = useState<ReadingPlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedPlanStoryIds, setSelectedPlanStoryIds] = useState<
    string[] | null
  >(null);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [isPlanScopeLoading, setIsPlanScopeLoading] = useState(false);

  const analytics = useMemo(
    () => getChallengeAnalytics(selectedChild, locale, selectedPlanStoryIds ?? undefined),
    [selectedChild, locale, selectedPlanStoryIds],
  );

  const childName =
    selectedChild?.child?.name ?? selectedChild?.name ?? t("unknown");

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      if (!selectedChild?.childId) {
        setReadingPlans([]);
        setSelectedPlanId("");
        setSelectedPlanStoryIds(null);
        setIsPlansLoading(false);
        setIsPlanScopeLoading(false);
        return;
      }

      setIsPlansLoading(true);
      setReadingPlans([]);
      setSelectedPlanId("");
      setSelectedPlanStoryIds(null);
      setIsPlanScopeLoading(false);

      try {
        const plans = await getChildReadingPlansAction(selectedChild.childId);
        if (!cancelled) {
          const nextPlans = plans ?? [];
          setReadingPlans(nextPlans);

          const defaultPlan =
            nextPlans.find((plan) => plan.isActive) ?? nextPlans[0];
          setSelectedPlanId(defaultPlan?.id ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load reading plans:", error);
          setReadingPlans([]);
          setSelectedPlanId("");
        }
      } finally {
        if (!cancelled) {
          setIsPlansLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, [selectedChild?.childId]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedPlan = async () => {
      if (!selectedChild?.childId || !selectedPlanId) {
        setSelectedPlanStoryIds(null);
        setIsPlanScopeLoading(false);
        return;
      }

      setIsPlanScopeLoading(true);
      setSelectedPlanStoryIds(null);

      try {
        const detail = await getChildReadingPlanByIdAction(
          selectedPlanId,
          selectedChild.childId,
        );

        if (cancelled) return;

        if (!detail) {
          setSelectedPlanId("");
          setSelectedPlanStoryIds(null);
          return;
        }

        const storyIds = detail.roadmaps.flatMap((roadmap) =>
          roadmap.worlds.flatMap((world) =>
            world.stories.map((story) => story.id),
          ),
        );

        setSelectedPlanStoryIds(storyIds);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load reading plan detail:", error);
          setSelectedPlanId("");
          setSelectedPlanStoryIds(null);
        }
      } finally {
        if (!cancelled) {
          setIsPlanScopeLoading(false);
        }
      }
    };

    void loadSelectedPlan();

    return () => {
      cancelled = true;
    };
  }, [selectedChild?.childId, selectedPlanId]);

  const formatPlanStatus = (status: ReadingPlanSummary["status"]) => {
    switch (status) {
      case "ACTIVE":
        return t("readingPlanFilter.planStatus.active", {
          defaultValue: "Active",
        });
      case "GENERATING":
        return t("readingPlanFilter.planStatus.generating", {
          defaultValue: "Generating",
        });
      case "FAILED":
        return t("readingPlanFilter.planStatus.failed", {
          defaultValue: "Failed",
        });
      case "SUPERSEDED":
        return t("readingPlanFilter.planStatus.archived", {
          defaultValue: "Archived",
        });
      case "COMPLETED":
        return t("readingPlanFilter.planStatus.completed", {
          defaultValue: "Completed",
        });
      case "DRAFT":
        return t("readingPlanFilter.planStatus.draft", {
          defaultValue: "Draft",
        });
      case "PAUSED":
        return t("readingPlanFilter.planStatus.paused", {
          defaultValue: "Paused",
        });
      default:
        return status;
    }
  };

  const scopedStoryIds = selectedPlanStoryIds ?? undefined;

  const filteredProgress = useMemo(() => {
    if (!selectedChild) return [];
    if (!scopedStoryIds) return selectedChild.progress ?? [];

    const allowedStoryIds = new Set(scopedStoryIds);
    return (selectedChild.progress ?? []).filter(
      (progress) => progress.storyId && allowedStoryIds.has(progress.storyId),
    );
  }, [scopedStoryIds, selectedChild]);

  const filteredStories = useMemo(() => {
    if (!selectedChild) return [];
    if (!scopedStoryIds) return selectedChild.stories ?? [];

    const allowedStoryIds = new Set(scopedStoryIds);
    return (selectedChild.stories ?? []).filter((story) =>
      allowedStoryIds.has(story.id),
    );
  }, [scopedStoryIds, selectedChild]);

  const isLoadingPlanScope =
    Boolean(selectedPlanId) && isPlanScopeLoading;

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
      <div className="rounded-xl border border-black/10 bg-card p-4 md:p-5 shadow-warm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-xl md:text-3xl text-foreground mb-2">
              {t("riddleStatistics.title")}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t("riddleStatistics.description", { childName })}
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("readingPlanFilter.label", {
                defaultValue: "Filter by reading plan",
              })}
            </label>
            <Select
              value={selectedPlanId}
              onValueChange={setSelectedPlanId}
              disabled={isPlansLoading || isPlanScopeLoading || readingPlans.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-lg border border-black/10 bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary">
                <SelectValue
                  placeholder={t("readingPlanFilter.label", {
                    defaultValue: "Filter by reading plan",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {readingPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {`${t("readingPlanFilter.planLabel", {
                      defaultValue: "Plan",
                    })} #${plan.planNumber} • ${formatPlanStatus(plan.status)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPlansLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("readingPlanFilter.loadingPlans", {
                  defaultValue: "Loading reading plans...",
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoadingPlanScope ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {!isLoadingPlanScope && !analytics.hasAttempts && (
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

      {!isLoadingPlanScope && (
        <RiddlesStats
          childProgress={filteredProgress}
          stories={filteredStories}
          analytics={analytics}
        />
      )}
    </TabsContent>
  );
}
