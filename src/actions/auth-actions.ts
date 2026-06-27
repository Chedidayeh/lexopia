"use server";

import { auth, signIn, unstable_update } from "@/src/auth";
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
import type { SubscriptionPlan } from "@/src/types/types";

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

  await prisma.user.update({
    where: { id: session.user.id },
    data: { subscriptionPlan: plan },
  });

  await unstable_update({
    user: {
      subscriptionPlan: plan,
    },
  });
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
