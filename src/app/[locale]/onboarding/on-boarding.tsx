"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  INITIAL_ONBOARDING_FORM,
  type OnboardingFormState,
  validateStep2,
  validateStep3WithPlan,
  validateStep4WithPlan,
  validateStep5WithPlan,
  validateOnboardingFormWithPlan,
  calculateAgeFromDate,
} from "@/src/lib/onboarding/schemas";
import { completeOnboardingAction } from "./actions/onboarding-actions";
import { getPlanConstraints, type PlanConstraints } from "@/src/lib/onboarding/plan-constraints";
import { SubscriptionPlan } from "@/src/types/types";
import {
  NameStep,
  BirthDateStep,
  GenderStep,
  LanguageStep,
  ReadingLevelStep,
  ChallengesStep,
  InterestsStep,
  CharacterTypeStep,
  StoryToneStep,
  StoriesPerWeekStep,
  NotificationsStep,
  OverviewStep,
  IntroStep,
} from "@/src/lib/onboarding/element-steps";

const TOTAL_STEPS = 12;

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

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_ONBOARDING_FORM);
  const [planConstraints, setPlanConstraints] = useState<PlanConstraints>(
    getPlanConstraints(SubscriptionPlan.FREE)
  );

  // Fetch user's subscription plan on mount
  useEffect(() => {
    async function fetchPlan() {
      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          const constraints = getPlanConstraints(data.subscriptionPlan);
          setPlanConstraints(constraints);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plan:", error);
        // Default to FREE plan
        setPlanConstraints(getPlanConstraints(SubscriptionPlan.FREE));
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, []);

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
    // Individual validators for each element-by-element step
    const validators = [
      // Step 0: Intro (no validation needed)
      () => ({ valid: true, message: "" }),
      // Step 1: Name
      () => {
        if (!form.name || form.name.trim().length === 0) {
          return { valid: false, message: "childNameRequired" };
        }
        return { valid: true, message: "" };
      },
      // Step 2: Birth date
      () => {
        if (!form.birthDate) {
          return { valid: false, message: "invalidAge" };
        }
        const age = calculateAgeFromDate(form.birthDate);
        if (age < 3 || age > 12) {
          return { valid: false, message: "invalidAge" };
        }
        return { valid: true, message: "" };
      },
      // Step 3: Gender
      () => {
        if (!form.gender) {
          return { valid: false, message: "selectGender" };
        }
        return { valid: true, message: "" };
      },
      // Step 4: Language
      () => {
        if (!form.primaryLanguage) {
          return { valid: false, message: "selectLanguageRequired" };
        }
        return { valid: true, message: "" };
      },
      // Step 5: Reading level
      () => {
        if (!form.readingLevel) {
          return { valid: false, message: "selectReadingLevel" };
        }
        return { valid: true, message: "" };
      },
      // Step 6: Challenges
      () => validateStep3WithPlan(
        {
          primaryLanguage: form.primaryLanguage,
          readingLevel: form.readingLevel,
          assignedChallenges: form.assignedChallenges,
        },
        planConstraints
      ),
      // Step 7: Interests
      () => {
        if (form.interests.length === 0) {
          return { valid: false, message: "selectAtLeastOneTheme" };
        }
        const maxThemes = planConstraints?.maxThemes ?? 5;
        if (form.interests.length > maxThemes) {
          return { valid: false, message: "maxInterests" };
        }
        return { valid: true, message: "" };
      },
      // Step 8: Character type
      () => {
        if (!form.favoriteCharacterType) {
          return { valid: false, message: "selectCharacterType" };
        }
        return { valid: true, message: "" };
      },
      // Step 9: Story tone
      () => {
        if (!form.storyTone) {
          return { valid: false, message: "selectStoryTone" };
        }
        return { valid: true, message: "" };
      },
      // Step 10: Stories per week
      () => validateStep5WithPlan(
        {
          storiesPerWeek: form.storiesPerWeek,
          sessionDurationMins: form.sessionDurationMins,
          activateNotifications: form.activateNotifications,
        },
        planConstraints
      ),
      // Step 11: Notifications (no validation needed, it's optional)
      () => ({ valid: true, message: "" }),
      // Step 12: Overview (no validation needed)
      () => ({ valid: true, message: "" }),
    ];
    
    const result = validators[step]();
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
    const validation = validateOnboardingFormWithPlan(form, planConstraints);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">{t("loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-xl px-2 sm:px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex justify-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                {t("cancel")}
              </Button>
            </div>
            {step === 0 && <IntroStep t={t} form={form} updateForm={updateForm} />}
            {step === 1 && <NameStep t={t} form={form} updateForm={updateForm} />}
            {step === 2 && <BirthDateStep t={t} form={form} updateForm={updateForm} />}
            {step === 3 && <GenderStep t={t} form={form} updateForm={updateForm} />}
            {step === 4 && <LanguageStep t={t} form={form} updateForm={updateForm} />}
            {step === 5 && <ReadingLevelStep t={t} form={form} updateForm={updateForm} />}
            {step === 6 && (
              <ChallengesStep
                t={t}
                form={form}
                updateForm={updateForm}
                toggleChallenge={toggleArrayItem}
                planConstraints={planConstraints}
              />
            )}
            {step === 7 && (
              <InterestsStep
                t={t}
                form={form}
                updateForm={updateForm}
                toggleInterest={toggleArrayItem}
                planConstraints={planConstraints}
              />
            )}
            {step === 8 && <CharacterTypeStep t={t} form={form} updateForm={updateForm} />}
            {step === 9 && <StoryToneStep t={t} form={form} updateForm={updateForm} />}
            {step === 10 && (
              <StoriesPerWeekStep
                t={t}
                form={form}
                updateForm={updateForm}
                planConstraints={planConstraints}
              />
            )}
            {step === 11 && <NotificationsStep t={t} form={form} updateForm={updateForm} />}
            {step === 12 && <OverviewStep t={t} form={form} updateForm={updateForm} />}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {step > 0 && (
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
              )}

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
    </div>
  );
}
