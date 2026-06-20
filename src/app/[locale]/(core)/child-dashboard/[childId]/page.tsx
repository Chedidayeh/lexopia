import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import MissingDataAlert from "@/src/components/shared/MissingDataAlert";
import {
  getBadges,
  getChildProfileById,
} from "@/src/lib/dashboard/queries";
import { getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import ChildDashboardInteractive from "../_components/ChildDashboardInteractive";
import { validateChildDashboardAccess } from "../_lib/validate-child-access";
export const metadata: Metadata = {
  title: "My Dashboard - Readdly",
  description:
    "Track your reading progress, discover new stories, and celebrate your achievements in your personalized learning hub.",
};

export default async function ChildDashboardPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const t = await getTranslations("ChildDashboard");
  const { childId } = await params;

  const access = await validateChildDashboardAccess(childId);
  if (!access) {
    return <MissingDataAlert message={t("childNotFound")} />;
  }

  const [child, readingPlan, badges] = await Promise.all([
    getChildProfileById(childId),
    getChildReadingPlanDetail(childId),
    getBadges().catch(() => []),
  ]);

  if (!child) {
    return <MissingDataAlert message={t("childNotFound")} />;
  }

  return (
    <div className="min-h-screen p-4">
      <ChildDashboardInteractive
        allBadges={badges}
        child={child}
        readingPlan={readingPlan}
        userRole={access.session.user.role}
      />
    </div>
  );
}
