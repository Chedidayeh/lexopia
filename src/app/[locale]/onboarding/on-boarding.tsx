"use client";

import { useState } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  INITIAL_ONBOARDING_FORM,
  type OnboardingFormState,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateOnboardingForm,
} from "@/src/lib/onboarding/schemas";
import {
  ChildBasicsStep,
  GoalsLaunchStep,
  InterestsStep,
  ReadingProfileStep,
} from "@/src/lib/onboarding/onboarding-steps";
import { completeOnboardingAction } from "./actions/onboarding-actions";
import { StepIndicator, TOTAL_STEPS } from "./_components/step-indicator";

const ONBOARDING_ERROR_KEYS = new Set([
  "childNameRequired",
  "invalidAge",
  "selectGender",
  "selectLanguageRequired",
  "selectReadingLevel",
  "selectAtLeastOneChallenge",
  "invalidChallenge",
  "selectAtLeastOneTheme",
  "maxInterests",
  "invalidInterest",
  "selectCharacterType",
  "selectStoryTone",
  "selectReadingFrequency",
  "selectSessionDuration",
]);

export default function ParentOnboarding() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const { isRTL } = useLocale();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_ONBOARDING_FORM);

  function updateForm<K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayItem(key: "interests" | "assignedChallenges", value: string) {
    setForm((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function validateCurrentStep(): boolean {
    const validators = [
      () => validateStep2(form),
      () => validateStep3(form),
      () => validateStep4(form),
      () => validateStep5(form),
    ];
    const result = validators[step - 1]();
    if (!result.valid) {
      toast.error(t(result.message));
      return false;
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    if (step === 1) {
      router.push("/");
      return;
    }
    setStep((s) => s - 1);
  }

  async function handleComplete() {
    const validation = validateOnboardingForm(form);
    if (!validation.valid) {
      toast.error(t(validation.message));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeOnboardingAction(form);
      if (!result.success) {
        const message = result.error.message;
        toast.error(
          ONBOARDING_ERROR_KEYS.has(message) ? t(message) : message,
        );
        return;
      }
      toast.success(t("childCreated"));
      router.push("/parent-dashboard");
      router.refresh();
    } catch {
      toast.error(t("onboardingError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl px-2 sm:px-0">
        <StepIndicator step={step} />

        <div className="bg-card rounded-lg border p-4 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {step === 1 && (
                <ChildBasicsStep t={t} form={form} updateForm={updateForm} />
              )}
              {step === 2 && (
                <ReadingProfileStep
                  t={t}
                  form={form}
                  updateForm={updateForm}
                  toggleChallenge={toggleArrayItem}
                />
              )}
              {step === 3 && (
                <InterestsStep
                  t={t}
                  form={form}
                  updateForm={updateForm}
                  toggleInterest={toggleArrayItem}
                />
              )}
              {step === 4 && (
                <GoalsLaunchStep t={t} form={form} updateForm={updateForm} />
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <BackIcon className="w-4 h-4 mr-2" />
                  {step === 1 ? t("cancel") : t("previous")}
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    onClick={handleNext}
                  >
                    {t("next")}
                    <NextIcon className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("settingUp") : t("startExploring")}
                    {!isSubmitting && <NextIcon className="w-4 h-4 ml-2" />}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
          {t("stepOf", { step, total: TOTAL_STEPS })}
        </p>
      </div>
    </div>
  );
}
