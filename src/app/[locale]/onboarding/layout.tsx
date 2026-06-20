import { auth } from "@/src/auth";
import { RoleType } from "@/src/types/types";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  if (session.user.newUser === false) {
    redirect("/parent-dashboard");
  }

  if(session.user.role === RoleType.ADMIN){
    redirect("/admin-dashboard");
  }
  return <div className="relative min-h-screen ">{children}</div>;
}