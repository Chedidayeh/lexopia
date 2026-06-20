import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import MissingDataAlert from "@/src/components/shared/MissingDataAlert";
import { getChildProfileById } from "@/src/lib/dashboard/queries";
import { getChildReadingPlanDetail } from "@/src/lib/reading-plan/queries";
import { validateChildDashboardAccess } from "../../_lib/validate-child-access";
import ReadingPlanContent from "../../_components/reading-plan/ReadingPlanContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ childId: string }>;
}): Promise<Metadata> {
  const { childId } = await params;
  const access = await validateChildDashboardAccess(childId);

  return {
    title: access
      ? `${access.childName}'s Reading Plan - Readdly`
      : "Reading Plan - Readdly",
    description: "Explore your personalized reading adventure path.",
  };
}

export default async function ChildReadingPlanPage({
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

  const [child, readingPlan] = await Promise.all([
    getChildProfileById(childId),
    getChildReadingPlanDetail(childId),
  ]);

  if (!child) {
    return <MissingDataAlert message={t("childNotFound")} />;
  }

  const childName = child.child?.name || child.name || "Young Reader";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <ReadingPlanContent
          childId={childId}
          childName={childName}
          initialPlan={readingPlan}
        />
      </div>
    </div>
  );
}
