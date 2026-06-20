export type OnboardingErrorCode =
  | "UNAUTHORIZED"
  | "ALREADY_ONBOARDED"
  | "VALIDATION_ERROR"
  | "ONBOARDING_FAILED";

export type OnboardingActionError = {
  code: OnboardingErrorCode;
  message: string;
  field?: string;
};

export type OnboardingActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: OnboardingActionError };

export type OnboardingCompleteData = {
  childId: string;
};
