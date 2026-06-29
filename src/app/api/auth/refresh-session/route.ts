import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        lemonSqueezyCustomerId: true,
        lemonSqueezySubscriptionId: true,
        lemonSqueezyVariantId: true,
        subscriptionRenewsAt: true,
        subscriptionCancelledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        lemonSqueezyCustomerId: user.lemonSqueezyCustomerId,
        lemonSqueezySubscriptionId: user.lemonSqueezySubscriptionId,
        lemonSqueezyVariantId: user.lemonSqueezyVariantId,
        subscriptionRenewsAt: user.subscriptionRenewsAt,
        subscriptionCancelledAt: user.subscriptionCancelledAt,
      }
    });
  } catch (error) {
    console.error("Failed to refresh session:", error);
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 });
  }
}
