"use server";

import { auth, unstable_update } from "@/src/auth";
import { createChildProfile } from "@/src/app/[locale]/onboarding/actions/onboarding-actions";
import { parseOnboardingForm } from "@/src/lib/onboarding/schemas";
import type { OnboardingFormState } from "@/src/lib/onboarding/schemas";
import type {
  OnboardingActionResult,
  OnboardingCompleteData,
  OnboardingErrorCode,
} from "@/src/lib/onboarding/types";

function fail<T = void>(
  code: OnboardingErrorCode,
  message: string,
  field?: string,
): OnboardingActionResult<T> {
  return { success: false, error: { code, message, field } };
}

export async function addChildAction(
  input: OnboardingFormState,
): Promise<OnboardingActionResult<OnboardingCompleteData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "You must be logged in to add a child");
  }

  const parsed = parseOnboardingForm(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      "VALIDATION_ERROR",
      issue.message,
      issue.path.join(".") || "form",
    );
  }

  try {
    const result = await createChildProfile(session.user.id, parsed.data);

    await unstable_update({
      user: {
        childId: result.childId,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[addChildAction]", error);
    return fail("ONBOARDING_FAILED", "An error occurred while creating the child profile");
  }
}
