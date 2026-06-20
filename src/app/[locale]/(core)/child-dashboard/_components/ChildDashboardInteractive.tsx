"use client";

import WelcomeBanner from "./WelcomeBanner";
import ProgressTracker from "./ProgressTracker";
import ReadingPlanPreviewCard from "./reading-plan/ReadingPlanPreviewCard";
import type { Badge, ChildProfile } from "@/src/lib/dashboard/types";
import {
  getStoriesCompleted,
  getTotalReadingTime,
} from "../../parent-dashboard/_lib/stats";
import { useEffect } from "react";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";

interface ChildDashboardInteractiveProps {
  allBadges: Badge[];
  child: ChildProfile;
  readingPlan: ReadingPlanDetailView | null;
  userRole: string;
}

const ChildDashboardInteractive = ({
  allBadges,
  child,
  readingPlan,
}: ChildDashboardInteractiveProps) => {
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

  const readingPlanPreview = (
    <ReadingPlanPreviewCard
      childId={childId}
      childName={childName}
      plan={readingPlan}
    />
  );

  return (
    <>
      <div className="lg:hidden space-y-4 container mx-auto px-4 py-4">
        {welcomeBanner}
        {readingPlanPreview}
        <ProgressTracker currentStars={child.totalStars || 0} />
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 gap-6 mx-auto px-4 py-4">
        <div className="lg:col-span-1 sticky top-8 h-fit">
          <ProgressTracker currentStars={child.totalStars || 0} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          {welcomeBanner}
          {readingPlanPreview}
        </div>
      </div>
    </>
  );
};

export default ChildDashboardInteractive;
