import { Metadata } from "next";
import { redirect } from "next/navigation";
import ParentDashboardInteractive from "./_components/ParentDashboardInteractive";
import { auth } from "@/src/auth";
import { RoleType } from "@/src/types/types";
import {
  getChildProfilesByParent,
  getDashboardAgeGroups,
  getParentById,
} from "@/src/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "Parent Dashboard - Lexopia",
  description:
    "Monitor your children's reading progress, view achievements, and get AI-powered insights about their learning journey.",
};

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { parentId } = await searchParams;
  const userRole = session.user.role;

  if (userRole === RoleType.PARENT && session.user.newUser) {
    redirect("/onboarding");
  }

  const usedParentId =
    userRole === RoleType.PARENT ? session.user.id : parentId;

  if (!usedParentId) {
    redirect("/");
  }

  const [parentData, childProfiles] = await Promise.all([
    getParentById(usedParentId),
    getChildProfilesByParent(usedParentId).catch(() => []),
  ]);

  if (!parentData) {
    redirect("/");
  }

  const ageGroups = getDashboardAgeGroups();

  console.log("[Parent Dashboard] Rendering dashboard for parent", {

    childProfiles,
  
  });

  return (
    <div className="p-4">
      <ParentDashboardInteractive
        session={session}
        parentData={parentData}
        childProfiles={childProfiles}
        ageGroups={ageGroups}
        userRole={userRole}
      />
    </div>
  );
}
