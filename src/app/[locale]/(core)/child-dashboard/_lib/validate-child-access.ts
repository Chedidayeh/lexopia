import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { RoleType } from "@/src/types/types";

export async function validateChildDashboardAccess(childId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const childRecord = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true, name: true },
  });

  if (!childRecord) {
    return null;
  }

  if (
    session.user.role !== RoleType.ADMIN &&
    childRecord.parentId !== session.user.id
  ) {
    redirect("/");
  }

  return {
    session,
    childId,
    childName: childRecord.name,
  };
}
