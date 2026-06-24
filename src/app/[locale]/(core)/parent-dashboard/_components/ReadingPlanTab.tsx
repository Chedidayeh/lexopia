"use client";

import { useCallback, useEffect, useState } from "react";
import { TabsContent } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ChildProfile, RoleType } from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Loader2,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import {
  generateReadingPlanAction,
  getChildReadingPlanAction,
} from "@/src/lib/reading-plan/server-actions";
import { generateStoryContentAction } from "@/src/lib/story-content/server-actions";
import { planHasGeneratingStory } from "@/src/lib/story-content/find-next-story";
import { planHasGeneratingTts } from "@/src/lib/tts/plan-tts-status";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import { READING_LEVELS } from "@/src/lib/onboarding/constants";
import ReadingPlanStatusCard from "./ReadingPlanStatusCard";
import LearningPathsSection from "./LearningPathsSection";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";


interface ReadingPlanTabProps {
  selectedChild: ChildProfile | undefined;
  userRole: RoleType;
  onPlanGenerated?: () => void;
}

export default function ReadingPlanTab({
  selectedChild,
  userRole,
  onPlanGenerated,
}: ReadingPlanTabProps) {
  const t = useTranslations("ParentDashboard.readingPlanTab");
  const tPlan = useTranslations("ParentDashboard.readingPlan");
  const tDashboard = useTranslations("ParentDashboard");
  const tOnboarding = useTranslations("Onboarding");
  const { isRTL } = useLocale();

  const childId = selectedChild?.childId || selectedChild?.id;
  const childName =
    selectedChild?.child?.name ?? selectedChild?.name ?? tDashboard("unknown");

  const [plan, setPlan] = useState<ReadingPlanDetailView | null>(null);
  const [canManuallyGenerateInitialPlan, setCanManuallyGenerateInitialPlan] =
    useState(false);
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(
    null,
  );
  const [showPlanConfirm, setShowPlanConfirm] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planRefreshKey, setPlanRefreshKey] = useState(0);
  const [showStoryConfirm, setShowStoryConfirm] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const requestKey = childId ? `${childId}:${planRefreshKey}` : null;
  const isPlanLoading =
    requestKey !== null && resolvedRequestKey !== requestKey;
  const displayPlan =
    resolvedRequestKey === requestKey ? plan : null;

  const canGeneratePlan =
    userRole === RoleType.PARENT && Boolean(childId && selectedChild);
  const showGeneratePlanButton =
    canGeneratePlan &&
    canManuallyGenerateInitialPlan &&
    !isGeneratingPlan &&
    (!displayPlan || displayPlan.status === "FAILED");
  const showAwaitingPlanState =
    Boolean(childId) &&
    !isPlanLoading &&
    !displayPlan &&
    !canManuallyGenerateInitialPlan;
  const canGenerateStory =
    userRole === RoleType.PARENT &&
    Boolean(childId && displayPlan?.nextStoryToGenerate);

  const handleGeneratePlan = async () => {
    if (!childId) return;

    setIsGeneratingPlan(true);
    try {
      const result = await generateReadingPlanAction(childId);
      if (!result.success) {
        toast.error(result.error || tPlan("failedToast"));
        return;
      }
      toast.success(tPlan("startedToast"));
      setPlanRefreshKey((k) => k + 1);
      onPlanGenerated?.();
    } catch {
      toast.error(tPlan("failedToast"));
    } finally {
      setIsGeneratingPlan(false);
      setShowPlanConfirm(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!childId || !displayPlan?.nextStoryToGenerate) return;

    setIsGeneratingStory(true);
    try {
      const result = await generateStoryContentAction(
        childId,
        displayPlan.nextStoryToGenerate.storyId,
      );
      if (!result.success) {
        toast.error(result.error || t("generateStoryFailed"));
        return;
      }
      toast.success(t("generateStoryStarted"));
      setPlanRefreshKey((k) => k + 1);
    } catch {
      toast.error(t("generateStoryFailed"));
    } finally {
      setIsGeneratingStory(false);
      setShowStoryConfirm(false);
    }
  };

  const fetchPlan = useCallback(async () => {
    if (!childId || !requestKey) {
      return {
        plan: null as ReadingPlanDetailView | null,
        canManuallyGenerateInitialPlan: false,
        key: null as string | null,
      };
    }

    const result = await getChildReadingPlanAction(childId);
    return {
      plan: result?.plan ?? null,
      canManuallyGenerateInitialPlan:
        result?.canManuallyGenerateInitialPlan ?? false,
      key: requestKey,
    };
  }, [childId, requestKey]);

  useEffect(() => {
    let cancelled = false;

    void fetchPlan().then((result) => {
      if (cancelled) return;

      setPlan(result.plan);
      setCanManuallyGenerateInitialPlan(result.canManuallyGenerateInitialPlan);
      setResolvedRequestKey(result.key);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPlan]);

  const refreshPlan = useCallback(() => {
    void fetchPlan().then((result) => {
      setPlan(result.plan);
      setCanManuallyGenerateInitialPlan(result.canManuallyGenerateInitialPlan);
      setResolvedRequestKey(result.key);
    });
  }, [fetchPlan]);

  useEffect(() => {
    if (
      displayPlan?.status !== "GENERATING" &&
      !planHasGeneratingStory(displayPlan) &&
      !planHasGeneratingTts(displayPlan)
    ) {
      return;
    }

    const interval = setInterval(() => {
      refreshPlan();
    }, 5000);

    return () => clearInterval(interval);
  }, [displayPlan, refreshPlan]);

  const readingLevelLabel = displayPlan?.readingLevel
    ? READING_LEVELS.find((level) => level.value === displayPlan.readingLevel)
      ?.labelKey
    : null;

  return (
    <>
      <TabsContent
        dir={isRTL ? "rtl" : "ltr"}
        value="reading-plan"
        className="space-y-4 md:space-y-6"
      >
        <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl p-4 md:p-6 border border-black/10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div>
                <h2 className="font-heading text-xl md:text-3xl text-foreground mb-2">
                  {t("title")}
                </h2>
                <p className="text-sm md:text-sm text-muted-foreground">
                  {t("description", { childName })}
                </p>
              </div>
            </div>
            {showGeneratePlanButton && !isPlanLoading && (
              <Button
                className="shrink-0 text-sm"
                disabled={isGeneratingPlan}
                onClick={() => setShowPlanConfirm(true)}
              >
                {isGeneratingPlan ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <>
                  </>
                )}
                {tDashboard("overview.generateReadingPlanButton")}
              </Button>
            )}
          </div>
        </div>

        {childId && (
          <ReadingPlanStatusCard childId={childId} refreshKey={planRefreshKey} />
        )}

        {!childId ? (
          <div className="rounded-xl border border-black/10 bg-card p-6 text-center text-muted-foreground text-sm">
            {t("noChildSelected")}
          </div>
        ) : isPlanLoading && !displayPlan ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !displayPlan ? (
          <div className="rounded-xl border border-dashed border-black/20 bg-card p-6 md:p-8 text-center">
            <Map className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-lg text-foreground mb-2">
              {showAwaitingPlanState ? t("awaitingPlanTitle") : t("emptyTitle")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {showAwaitingPlanState
                ? t("awaitingPlanDescription", { childName })
                : t("emptyDescription", { childName })}
            </p>
            {showGeneratePlanButton && (
              <Button
                disabled={isGeneratingPlan}
                onClick={() => setShowPlanConfirm(true)}
              >
                {isGeneratingPlan ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {tDashboard("overview.generateReadingPlanButton")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  icon: Target,
                  label: t("meta.planNumber"),
                  value: `#${displayPlan.planNumber}`,
                  color: "text-violet-600",
                },
                {
                  icon: GraduationCap,
                  label: t("meta.readingLevel"),
                  value: readingLevelLabel
                    ? tOnboarding(readingLevelLabel)
                    : displayPlan.readingLevel,
                  color: "text-blue-600",
                },
                {
                  icon: CalendarDays,
                  label: t("meta.weeklyGoal"),
                  value: tDashboard("overview.weeklyGoalValue", {
                    stories: displayPlan.storiesPerWeek,
                  }),
                  color: "text-green-600",
                },
                {
                  icon: Clock,
                  label: t("meta.sessionLength"),
                  value: t("meta.sessionMinutes", {
                    minutes: displayPlan.sessionDurationMins,
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
                  <p className="font-heading text-base font-semibold mt-0.5 line-clamp-2">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {displayPlan.sourceInterests.length > 0 && (
              <div className="rounded-xl border border-black/10 bg-card p-4 md:p-5">
                <p className="text-sm text-muted-foreground mb-2">{t("interests")}</p>
                <div className="flex flex-wrap gap-2">
                  {displayPlan.sourceInterests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {tOnboarding(`interests.${interest}`, { defaultValue: interest })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {displayPlan.storyTone && (
              <div className="rounded-xl border border-black/10 bg-card p-4 md:p-5">
                <p className="text-sm text-muted-foreground mb-1">{t("storyTone")}</p>
                <p className="text-sm">{displayPlan.storyTone}</p>
              </div>
            )}

            {canGenerateStory && displayPlan.nextStoryToGenerate && (
              <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base text-blue-900 dark:text-blue-100">
                      {t("generateStoryCtaTitle")}
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      {t("generateStoryCtaDescription", {
                        episodeTitle: displayPlan.nextStoryToGenerate.episodeTitle,
                        worldName: displayPlan.nextStoryToGenerate.worldName,
                        childName,
                      })}
                    </p>
                  </div>
                  <Button
                    className="shrink-0"
                    disabled={
                      isGeneratingStory ||
                      displayPlan.nextStoryToGenerate.generationStatus ===
                      "GENERATING"
                    }
                    onClick={() => setShowStoryConfirm(true)}
                  >
                    {isGeneratingStory ||
                      displayPlan.nextStoryToGenerate.generationStatus ===
                      "GENERATING" ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    {t("generateStoryButton")}
                  </Button>
                </div>
              </div>
            )}

            <LearningPathsSection
              displayPlan={displayPlan}
              canGenerateStory={canGenerateStory}
              isGeneratingStory={isGeneratingStory}
              onRequestGenerateStory={() => setShowStoryConfirm(true)}
            />
          </>
        )}
      </TabsContent>

      <AlertDialog open={showPlanConfirm} onOpenChange={setShowPlanConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPlan("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tPlan("confirmDescription", { childName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGeneratingPlan}>
              {tPlan("confirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isGeneratingPlan}
              onClick={(e) => {
                e.preventDefault();
                void handleGeneratePlan();
              }}
            >
              {isGeneratingPlan ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {tPlan("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showStoryConfirm} onOpenChange={setShowStoryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("generateStoryConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("generateStoryConfirmDescription", {
                childName,
                episodeTitle:
                  displayPlan?.nextStoryToGenerate?.episodeTitle ?? "",
                worldName: displayPlan?.nextStoryToGenerate?.worldName ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGeneratingStory}>
              {tPlan("confirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isGeneratingStory}
              onClick={(e) => {
                e.preventDefault();
                void handleGenerateStory();
              }}
            >
              {isGeneratingStory ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {t("generateStoryButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
