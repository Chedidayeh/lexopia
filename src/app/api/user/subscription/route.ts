import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { SubscriptionPlan } from "@/src/types/types";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewsAt: true,
        subscriptionCancelledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionRenewsAt: user.subscriptionRenewsAt,
      subscriptionCancelledAt: user.subscriptionCancelledAt,
    });
  } catch (error) {
    console.error("[GET /api/user/subscription]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionPlan: newPlan } = body;

    // Validate the subscription plan
    if (!Object.values(SubscriptionPlan).includes(newPlan)) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewsAt: true,
        subscriptionCancelledAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow downgrading (not upgrading)
    const currentPlan = user.subscriptionPlan;
    const planHierarchy = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.PRO]: 1,
      [SubscriptionPlan.PRO_PLUS]: 2,
    };

    if (planHierarchy[newPlan as keyof typeof planHierarchy] > planHierarchy[currentPlan as keyof typeof planHierarchy]) {
      return NextResponse.json(
        { error: "Cannot upgrade plan through this endpoint" },
        { status: 400 }
      );
    }

    // Update the user's subscription plan
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionPlan: newPlan },
      select: { subscriptionPlan: true },
    });

    // Update all children associated with this user to reflect the new plan constraints
    await prisma.child.updateMany({
      where: { parentId: session.user.id },
      data: {
        parentSubscriptionPlan: newPlan,
        maxThemesAllowed: newPlan === SubscriptionPlan.FREE ? 1 : newPlan === SubscriptionPlan.PRO ? 3 : 5,
        maxStoriesPerWeekAllowed: newPlan === SubscriptionPlan.FREE ? 1 : newPlan === SubscriptionPlan.PRO ? 3 : 7,
        maxChallengeTypes: newPlan === SubscriptionPlan.FREE ? 3 : newPlan === SubscriptionPlan.PRO ? 6 : 9,
      },
    });

    return NextResponse.json({
      subscriptionPlan: updatedUser.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionRenewsAt: user.subscriptionRenewsAt,
      subscriptionCancelledAt: user.subscriptionCancelledAt,
    });
  } catch (error) {
    console.error("[PATCH /api/user/subscription]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}