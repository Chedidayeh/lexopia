"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, ChevronsRight, Map, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { Badge as UIBadge } from "@/src/components/ui/badge";
import WelcomeBanner from "./WelcomeBanner";
import ReadingPlanContent from "./reading-plan/ReadingPlanContent";
import type { Badge, ChildProfile } from "@/src/lib/dashboard/types";
import {
  getStoriesCompleted,
  getTotalReadingTime,
} from "../../parent-dashboard/_lib/stats";
import { useEffect } from "react";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import type { ReadingPlanSummary } from "@/src/lib/reading-plan/queries";
import { getChildReadingPlanByIdAction } from "@/src/lib/reading-plan/server-actions";
import { cn } from "@/src/lib/utils";

interface ChildDashboardInteractiveProps {
  allBadges: Badge[];
  child: ChildProfile;
  readingPlan: ReadingPlanDetailView | null;
  allReadingPlans: ReadingPlanSummary[];
  userRole: string;
}

const ChildDashboardInteractive = ({
  allBadges,
  child,
  readingPlan,
  allReadingPlans,
}: ChildDashboardInteractiveProps) => {
  const t = useTranslations("ChildDashboard");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    readingPlan?.planId ?? null,
  );
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlanDetailView | null>(
    readingPlan,
  );
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const childBadges =
    child.badges
      ?.map((childBadge) =>
        allBadges.find((badge) => badge.id === childBadge.badgeId),
      )
      .filter((badge): badge is Badge => badge !== undefined) || [];

  const storiesCompleted = getStoriesCompleted(child);
  const readingTimeMinutes = getTotalReadingTime(child);
  const childName = child.child?.name || child.name || "Young Reader";
  const childId = child.childId || child.id;
  const activePlan = allReadingPlans.find((plan) => plan.id === selectedPlanId) ?? null;

  const formatPlanStatus = (status: ReadingPlanSummary["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "GENERATING":
        return "Generating";
      case "FAILED":
        return "Failed";
      case "SUPERSEDED":
        return "Archived";
      default:
        return status;
    }
  };

  const handlePlanSelect = useCallback(async (planId: string) => {
    if (planId === selectedPlanId) return;
    
    setSelectedPlanId(planId);
    setIsLoadingPlan(true);
    
    try {
      const plan = await getChildReadingPlanByIdAction(planId, childId);
      if (plan) {
        setSelectedPlan(plan);
      }
    } catch (error) {
      console.error("Failed to fetch plan details:", error);
    } finally {
      setIsLoadingPlan(false);
    }
  }, [selectedPlanId, childId]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const hours = Math.floor(readingTimeMinutes / 60);
  const minutes = readingTimeMinutes % 60;
  const readingTimeSubtitle =
    minutes > 0 ? `(${hours}h ${minutes}m)` : `(${hours}h)`;

  const isNewReader = storiesCompleted === 0 && (child.totalStars || 0) === 0;

  const welcomeBanner = (
    <WelcomeBanner
      childName={childName}
      avatar={child.child?.avatar ?? undefined}
      isNewReader={isNewReader}
      totalStars={child.totalStars || 0}
      recentBadges={childBadges}
      storiesCompleted={storiesCompleted}
      readingTimeMinutes={readingTimeMinutes}
      readingTimeSubtitle={readingTimeSubtitle}
    />
  );

  const readingPlanContent = (
    <ReadingPlanContent
      childId={childId}
      childName={childName}
      initialPlan={selectedPlan}
      showBackLink={false}
    />
  );

  const planSelector = (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-linear-to-br from-background via-card to-muted/25 shadow-warm-lg">
      <div className="border-b border-black/5 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("readingPlan.selectPlan")}</span>
            </div>
            <div>
              <h3 className="font-heading text-lg text-foreground">{t("readingPlan.selectPlan")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch between saved plans and keep the active roadmap in view.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
            <Map className="h-4 w-4 text-primary" />
            <span>{allReadingPlans.length} plans</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <UIBadge variant="secondary" className="rounded-full px-3 py-1 text-[11px] font-medium">
            {activePlan ? `${t("readingPlan.planNumber", { number: activePlan.planNumber })}` : "No plan selected"}
          </UIBadge>
          {activePlan ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {activePlan.readyStories}/{activePlan.totalStories} stories ready
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4">
        {allReadingPlans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-background/60 px-4 py-6 text-sm text-muted-foreground">
            No reading plans available yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allReadingPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <Button
                  key={plan.id}
                  variant="ghost"
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isLoadingPlan}
                  aria-pressed={isSelected}
                  className={cn(
                    "group h-auto min-w-52 shrink-0 justify-start rounded-2xl border p-0 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                    isSelected
                      ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20"
                      : "border-black/10 bg-background/80 hover:border-primary/20",
                  )}
                >
                  <div className="flex w-full items-start gap-3 p-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {plan.planNumber}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {t("readingPlan.planNumber", { number: plan.planNumber })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {plan.readyStories}/{plan.totalStories} ready
                          </p>
                        </div>
                        <UIBadge
                          variant={plan.isActive ? "default" : "secondary"}
                          className="rounded-full text-[10px] uppercase tracking-wide"
                        >
                          {plan.isActive ? "Current" : formatPlanStatus(plan.status)}
                        </UIBadge>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {plan.sourceInterests.slice(0, 2).join(" • ") || "Personalized path"}
                        </span>
                        <ChevronsRight className={cn("h-4 w-4 transition-transform", isSelected ? "translate-x-0.5 text-primary" : "text-muted-foreground group-hover:translate-x-0.5")}/>
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden space-y-4 container mx-auto px-4 py-4">
        {welcomeBanner}
        {planSelector}
        {readingPlanContent}
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 gap-6 mx-auto px-4 py-4">
        <div className="lg:col-span-1 sticky top-8 h-fit">
          {planSelector}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {welcomeBanner}
          {readingPlanContent}
        </div>
      </div>
    </>
  );
};

export default ChildDashboardInteractive;
