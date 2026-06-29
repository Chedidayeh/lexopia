/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import crypto from "crypto";
import { SubscriptionPlan } from "@/src/types/types";
import { getReadingPlanConfiguration, getAvailableChallengesByPlan } from "@/src/lib/onboarding/plan-constraints";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-signature");
  
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }
  
  // Verify webhook signature
  const hmac = crypto
    .createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "")
    .update(body)
    .digest("hex");
  
  if (signature !== hmac) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  const event = JSON.parse(body);
  const eventName = event.meta.event_name;
  const data = event.data;
  
  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
        await handleSubscriptionEvent(data);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "subscription_payment_failed":
        await handlePaymentFailed(data);
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleSubscriptionEvent(data: any) {
  const attributes = data.attributes;
  const customData = attributes.custom_data;
  const userId = customData?.custom?.userId;
  
  if (!userId) {
    console.error("[Webhook] Missing userId in custom data");
    return;
  }
  
  // Map variant to plan
  const variantId = attributes.first_order_item?.attributes?.variant_id || attributes.variant_id;
  const planMap: Record<string, SubscriptionPlan> = {
    [process.env.LEMONSQUEEZY_VARIANT_ID_PRO || ""]: SubscriptionPlan.PRO,
    [process.env.LEMONSQUEEZY_VARIANT_ID_PRO_PLUS || ""]: SubscriptionPlan.PRO_PLUS,
  };
  
  const plan = planMap[variantId];
  
  if (!plan) {
    console.error("[Webhook] Unknown variant ID:", variantId);
    return;
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      lemonSqueezyCustomerId: attributes.customer_id,
      lemonSqueezySubscriptionId: data.id,
      lemonSqueezyVariantId: variantId,
      subscriptionStatus: attributes.status,
      subscriptionRenewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
      subscriptionCancelledAt: null,
      subscriptionPlan: plan,
    },
  });
  
  // Update children's constraints based on new plan
  await updateChildrenConstraints(userId, plan);
}

async function handleSubscriptionCancelled(data: any) {
  const attributes = data.attributes;
  const customData = attributes.custom_data;
  const userId = customData?.custom?.userId;
  
  if (!userId) {
    console.error("[Webhook] Missing userId in custom data");
    return;
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "cancelled",
      subscriptionCancelledAt: new Date(),
      subscriptionPlan: SubscriptionPlan.FREE,
    },
  });
  
  // Downgrade children to FREE constraints
  await updateChildrenConstraints(userId, SubscriptionPlan.FREE);
}

async function handlePaymentFailed(data: any) {
  const attributes = data.attributes;
  const customData = attributes.custom_data;
  const userId = customData?.custom?.userId;
  
  if (!userId) {
    console.error("[Webhook] Missing userId in custom data");
    return;
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "past_due",
    },
  });
}

async function updateChildrenConstraints(userId: string, plan: SubscriptionPlan) {
  const newConfig = getReadingPlanConfiguration(plan);
  const newChallenges = getAvailableChallengesByPlan(plan);

  await prisma.child.updateMany({
    where: { parentId: userId },
    data: {
      parentSubscriptionPlan: newConfig.parentSubscriptionPlan,
      maxThemesAllowed: newConfig.maxThemesAllowed,
      maxStoriesPerWeekAllowed: newConfig.maxStoriesPerWeekAllowed,
      storiesPerWeek: newConfig.maxStoriesPerWeekAllowed,
      maxChallengeTypes: newConfig.maxChallengeTypes,
      assignedChallenges: newChallenges,
      maxWorldsPerRoadmapAllowed: newConfig.maxWorldsPerRoadmapAllowed,
      maxEpisodesPerWorldAllowed: newConfig.maxEpisodesPerWorldAllowed,
      maxChaptersPerStoryAllowed: newConfig.maxChaptersPerStoryAllowed,
    },
  });
}
