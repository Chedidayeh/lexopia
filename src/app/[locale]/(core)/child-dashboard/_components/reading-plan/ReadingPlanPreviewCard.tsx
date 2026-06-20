"use client";

import { BookOpen, ChevronRight, Loader2, Map, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import {
  countCompletedStories,
  findPrimaryStoryAction,
  getStoryDisplayTitle,
} from "../../_lib/reading-plan-helpers";

interface ReadingPlanPreviewCardProps {
  childId: string;
  childName: string;
  plan: ReadingPlanDetailView | null;
}

export default function ReadingPlanPreviewCard({
  childId,
  childName,
  plan,
}: ReadingPlanPreviewCardProps) {
  const t = useTranslations("ChildDashboard");
  const planHref = `/child-dashboard/${childId}/reading-plan`;

  if (!plan) {
    return (
      <div className="rounded-xl border border-black/10 bg-card p-5 shadow-warm-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-xl text-foreground">
              {t("readingPlan.noPlanTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("readingPlan.noPlanDescription", { childName })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (plan.status === "GENERATING") {
    return (
      <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
          <div>
            <h2 className="font-heading text-lg text-foreground">
              {t("readingPlan.generatingTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("readingPlan.generatingDescription", { childName })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (plan.status === "FAILED") {
    return (
      <div className="rounded-xl border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 p-5">
        <h2 className="font-heading text-lg text-foreground">
          {t("readingPlan.failedTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("readingPlan.failedDescription")}
        </p>
      </div>
    );
  }

  const primaryStory = findPrimaryStoryAction(plan);
  const completedCount = countCompletedStories(plan);
  const progressPercent =
    plan.totalStories > 0
      ? Math.round((completedCount / plan.totalStories) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-black/10 bg-card p-5 md:p-6 shadow-warm-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Map className="h-5 w-5 text-primary shrink-0" />
          <h2 className="font-heading text-xl md:text-2xl text-foreground truncate">
            {t("readingPlan.title")}
          </h2>
        </div>
        <Badge variant="outline" className="shrink-0">
          {t("readingPlan.storyProgress", {
            ready: plan.readyStories,
            total: plan.totalStories,
          })}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("readingPlanPage.stats.completed")}</span>
          <span>
            {completedCount}/{plan.totalStories}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {primaryStory && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {primaryStory.access.kind === "continue"
              ? t("readingPlan.continueReading")
              : t("readingPlan.upNext")}
          </p>
          <p className="font-heading text-lg text-foreground mt-1 line-clamp-2">
            {getStoryDisplayTitle(primaryStory.story)}
          </p>
          <Button size="sm" className="mt-3" asChild>
            <Link
              href={`/story-reading-interface/${primaryStory.story.id}?childId=${childId}`}
            >
              <BookOpen className="h-4 w-4 me-1" />
              {primaryStory.access.kind === "continue"
                ? t("readingPlan.continueReading")
                : t("readingPlan.startReading")}
            </Link>
          </Button>
        </div>
      )}

      <Button variant="outline" className="w-full justify-between" asChild>
        <Link href={planHref}>
          {t("readingPlanPage.viewFullPlan")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
