"use server";

import { auth, signIn } from "@/src/auth";
import { hashPassword } from "@/src/lib/password";
import { prisma } from "@/src/lib/prisma";
import type {
  AuthActionResult,
  AuthErrorCode,
  CredentialsSignInInput,
  RegisterInput,
} from "@/src/lib/auth/types";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/src/lib/auth/validators";
import { findUserByEmail } from "@/src/lib/auth/user";
import { SubscriptionPlan } from "@/src/types/types";
import { getReadingPlanConfiguration, getAvailableChallengesByPlan } from "@/src/lib/onboarding/plan-constraints";
import { createCheckout, createCustomerPortal } from "@/src/lib/subscriptions/lemonsqueezy";

function fail<T = void>(
  code: AuthErrorCode,
  message: string,
): AuthActionResult<T> {
  return {
    success: false,
    error: { code, message },
  };
}

export async function registerAction(
  input: RegisterInput,
): Promise<AuthActionResult<{ userId: string }>> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const { password } = input;

  if (!validateName(name)) {
    return fail("FULL_NAME_REQUIRED", "Full name is required");
  }

  if (!validateEmail(email)) {
    return fail("INVALID_EMAIL", "Invalid email address");
  }

  if (!validatePassword(password)) {
    return fail("PASSWORD_TOO_WEAK", "Password must be at least 8 characters");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return fail("EMAIL_ALREADY_EXISTS", "Email already exists");
  }

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "PARENT",
        newUser: true,
        subscriptionPlan: "FREE",
      },
    });

    return { success: true, data: { userId: user.id } };
  } catch (error) {
    console.error("[registerAction]", error);
    return fail("REGISTRATION_FAILED", "Registration failed");
  }
}

export async function selectSubscriptionPlanAction(
  plan: SubscriptionPlan,
): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  // Only allow FREE plan to be selected directly
  if (plan !== SubscriptionPlan.FREE) {
    throw new Error("Paid plans must go through checkout");
  }

  // Get the new reading plan configuration for this plan
  const newConfig = getReadingPlanConfiguration(plan);
  const newChallenges = getAvailableChallengesByPlan(plan);

  // Update user's subscription plan
  await prisma.user.update({
    where: { id: session.user.id },
    data: { subscriptionPlan: plan },
  });

  // Update all children's reading plan configuration to match the new plan
  await prisma.child.updateMany({
    where: { parentId: session.user.id },
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

export async function createCheckoutAction(
  plan: SubscriptionPlan,
): Promise<AuthActionResult<{ checkoutUrl: string }>> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return fail("UNAUTHORIZED", "You must be logged in to subscribe");
  }

  if (plan === SubscriptionPlan.FREE) {
    return fail("INVALID_PLAN", "Free plan does not require checkout");
  }

  try {
    const checkoutUrl = await createCheckout(
      session.user.email,
      plan,
      session.user.id
    );

    return { success: true, data: { checkoutUrl } };
  } catch (error) {
    console.error("[createCheckoutAction]", error);
    return fail("CHECKOUT_FAILED", "Failed to create checkout session");
  }
}

export async function createCustomerPortalAction(): Promise<AuthActionResult<{ portalUrl: string }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "You must be logged in to manage subscription");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lemonSqueezySubscriptionId: true },
  });

  console.log("[createCustomerPortalAction] User subscription ID:", user?.lemonSqueezySubscriptionId);

  if (!user?.lemonSqueezySubscriptionId) {
    console.error("[createCustomerPortalAction] No subscription ID found for user");
    return fail("NO_SUBSCRIPTION", "No active subscription found");
  }

  try {
    const portalUrl = await createCustomerPortal(user.lemonSqueezySubscriptionId);
    console.log("[createCustomerPortalAction] Portal URL:", portalUrl);

    return { success: true, data: { portalUrl } };
  } catch (error) {
    console.error("[createCustomerPortalAction]", error);
    return fail("PORTAL_FAILED", "Failed to create customer portal session");
  }
}

export async function credentialsSignInAction(
  input: CredentialsSignInInput,
): Promise<AuthActionResult> {
  const email = normalizeEmail(input.email);
  const { password } = input;

  if (!validateEmail(email)) {
    return fail("INVALID_EMAIL", "Invalid email address");
  }

  if (!password) {
    return fail("INVALID_CREDENTIALS", "Email and password are required");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return fail("UNAUTHORIZED", "No account found with this email");
  }

  if (!user.password) {
    return fail(
      "INVALID_CREDENTIALS",
      "This account uses Google sign-in. Please continue with Google.",
    );
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        return fail("INVALID_CREDENTIALS", "Password is incorrect");
      }
      return fail("LOGIN_FAILED", result.error);
    }

    return { success: true };
  } catch (error) {
    console.error("[credentialsSignInAction]", error);
    return fail("LOGIN_FAILED", "Login failed");
  }
}
