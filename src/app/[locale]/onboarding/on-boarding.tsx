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
  IntroStep2,
  stopIntroAudio,
} from "@/src/lib/onboarding/element-steps";

const ONBOARDING_STORAGE_KEY = "onboarding_data";

interface StoredOnboardingData {
  form: Omit<OnboardingFormState, "birthDate"> & { birthDate: string | null };
  step: number;
}

// Helper functions for localStorage
function saveOnboardingData(form: OnboardingFormState, step: number) {
  try {
    const data: StoredOnboardingData = {
      form: {
        ...form,
        birthDate: form.birthDate ? form.birthDate.toISOString() : null,
      },
      step,
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save onboarding data:", error);
  }
}

function loadOnboardingData(): StoredOnboardingData | null {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;

    const data: StoredOnboardingData = JSON.parse(stored);
    return data;
  } catch (error) {
    console.error("Failed to load onboarding data:", error);
    return null;
  }
}

function clearOnboardingData() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear onboarding data:", error);
  }
}

const TOTAL_STEPS = 13;

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
  const [hasSavedData, setHasSavedData] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadOnboardingData();
    if (savedData) {
      setForm({
        ...savedData.form,
        birthDate: savedData.form.birthDate ? new Date(savedData.form.birthDate) : null,
      });
      setStep(savedData.step);
      setHasSavedData(true);
      toast.success("Progress restored from previous session");
    }
    setIsDataLoaded(true);
  }, []);

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

  // Auto-save form changes to localStorage (only after initial data load)
  useEffect(() => {
    if (isDataLoaded) {
      saveOnboardingData(form, step);
    }
  }, [form, step, isDataLoaded]);

  // Scroll to top when navigating to IntroStep2
  useEffect(() => {
    if (step === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

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

  function handleResetData() {
    if (window.confirm("Are you sure you want to reset all onboarding data? This cannot be undone.")) {
      clearOnboardingData();
      setForm(INITIAL_ONBOARDING_FORM);
      setStep(0);
      setHasSavedData(false);
      toast.success("Onboarding data has been reset");
    }
  }

  function validateCurrentStep(): boolean {
    // Individual validators for each element-by-element step
    const validators = [
      // Step 0: Intro (no validation needed)
      () => ({ valid: true, message: "" }),
      // Step 1: IntroStep2 (no validation needed)
      () => ({ valid: true, message: "" }),
      // Step 2: Name
      () => {
        if (!form.name || form.name.trim().length === 0) {
          return { valid: false, message: "childNameRequired" };
        }
        return { valid: true, message: "" };
      },
      // Step 3: Birth date
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
      // Step 4: Gender
      () => {
        if (!form.gender) {
          return { valid: false, message: "selectGender" };
        }
        return { valid: true, message: "" };
      },
      // Step 5: Language
      () => {
        if (!form.primaryLanguage) {
          return { valid: false, message: "selectLanguageRequired" };
        }
        return { valid: true, message: "" };
      },
      // Step 6: Reading level
      () => {
        if (!form.readingLevel) {
          return { valid: false, message: "selectReadingLevel" };
        }
        return { valid: true, message: "" };
      },
      // Step 7: Challenges
      () => validateStep3WithPlan(
        {
          primaryLanguage: form.primaryLanguage,
          readingLevel: form.readingLevel,
          assignedChallenges: form.assignedChallenges,
        },
        planConstraints
      ),
      // Step 8: Interests
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
      // Step 9: Character type
      () => {
        if (!form.favoriteCharacterType) {
          return { valid: false, message: "selectCharacterType" };
        }
        return { valid: true, message: "" };
      },
      // Step 10: Story tone
      () => {
        if (!form.storyTone) {
          return { valid: false, message: "selectStoryTone" };
        }
        return { valid: true, message: "" };
      },
      // Step 11: Stories per week
      () => validateStep5WithPlan(
        {
          storiesPerWeek: form.storiesPerWeek,
          sessionDurationMins: form.sessionDurationMins,
          activateNotifications: form.activateNotifications,
        },
        planConstraints
      ),
      // Step 12: Notifications (no validation needed, it's optional)
      () => ({ valid: true, message: "" }),
      // Step 13: Overview (no validation needed)
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
    stopIntroAudio();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    if (step === 0) {
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
      clearOnboardingData();
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
      <div className="fixed inset-0 z-99 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-3">
            <span
              className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"
              aria-hidden="true"
            />
            <span>{t("loading") || "Loading..."}</span>
          </span>
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
            {step === 1 && <IntroStep2 t={t} form={form} updateForm={updateForm} />}
            {step === 2 && <NameStep t={t} form={form} updateForm={updateForm} hasSavedData={hasSavedData} onResetData={handleResetData} />}
            {step === 3 && <BirthDateStep t={t} form={form} updateForm={updateForm} />}
            {step === 4 && <GenderStep t={t} form={form} updateForm={updateForm} />}
            {step === 5 && <LanguageStep t={t} form={form} updateForm={updateForm} />}
            {step === 6 && <ReadingLevelStep t={t} form={form} updateForm={updateForm} />}
            {step === 7 && (
              <ChallengesStep
                t={t}
                form={form}
                updateForm={updateForm}
                toggleChallenge={toggleArrayItem}
                planConstraints={planConstraints}
              />
            )}
            {step === 8 && (
              <InterestsStep
                t={t}
                form={form}
                updateForm={updateForm}
                toggleInterest={toggleArrayItem}
                planConstraints={planConstraints}
              />
            )}
            {step === 9 && <CharacterTypeStep t={t} form={form} updateForm={updateForm} />}
            {step === 10 && <StoryToneStep t={t} form={form} updateForm={updateForm} />}
            {step === 11 && (
              <StoriesPerWeekStep
                t={t}
                form={form}
                updateForm={updateForm}
                planConstraints={planConstraints}
              />
            )}
            {step === 12 && <NotificationsStep t={t} form={form} updateForm={updateForm} />}
            {step === 13 && <OverviewStep t={t} form={form} updateForm={updateForm} />}

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
