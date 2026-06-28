"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useLocale } from "@/src/contexts/LocaleContext";
import {
  INITIAL_ONBOARDING_FORM,
  type OnboardingFormState,
  validateStep3WithPlan,
  validateStep5WithPlan,
  validateOnboardingFormWithPlan,
  calculateAgeFromDate,
} from "@/src/lib/onboarding/schemas";
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
} from "@/src/lib/onboarding/element-steps";
import {
  getPlanConstraints,
  type PlanConstraints,
} from "@/src/lib/onboarding/plan-constraints";
import { SubscriptionPlan } from "@/src/types/types";
import { addChildAction } from "../actions/add-child-actions";
import { getChildProfilesByParentAction } from "@/src/lib/progress-service/server-actions";
import type { User } from "@/src/lib/dashboard/types";

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

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentData: User;
  onChildAdded: () => void;
}

export default function AddChildDialog({
  open,
  onOpenChange,
  parentData,
  onChildAdded,
}: AddChildDialogProps) {
  const t = useTranslations("Onboarding");
  const tDashboard = useTranslations("ParentDashboard");
  const { isRTL } = useLocale();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [childCount, setChildCount] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_ONBOARDING_FORM);
  const [planConstraints, setPlanConstraints] = useState<PlanConstraints>(
    getPlanConstraints(SubscriptionPlan.FREE),
  );

  useEffect(() => {
    async function fetchPlan() {
      try {
        const [subscriptionResponse, profiles] = await Promise.all([
          fetch("/api/user/subscription"),
          parentData?.id ? getChildProfilesByParentAction(parentData.id) : Promise.resolve([]),
        ]);

        if (subscriptionResponse.ok) {
          const data = await subscriptionResponse.json();
          setPlanConstraints(getPlanConstraints(data.subscriptionPlan));
        }

        if (Array.isArray(profiles)) {
          setChildCount(profiles.length);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plan:", error);
        setPlanConstraints(getPlanConstraints(SubscriptionPlan.FREE));
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [parentData.id]);

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
    
    const result = validators[step - 1]();
    if (!result.valid) {
      toast.error(t(result.message));
      return false;
    }
    return true;
  }

  function resetForm() {
    setForm(INITIAL_ONBOARDING_FORM);
    setStep(1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleBack() {
    if (step === 1) {
      handleOpenChange(false);
      return;
    }
    setStep((s) => s - 1);
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  async function handleComplete() {
    const validation = validateOnboardingFormWithPlan(form, planConstraints);
    if (!validation.valid) {
      toast.error(t(validation.message));
      return;
    }

    if (childCount >= planConstraints.maxChildProfiles) {
      toast.error("You have reached the child profile limit for your subscription plan");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addChildAction(form);
      if (!result.success) {
        const message = result.error.message;
        toast.error(
          ONBOARDING_ERROR_KEYS.has(message) ? t(message) : message,
        );
        return;
      }

      toast.success(tDashboard("addChildDialog.messages.createdSuccess"));
      resetForm();
      onOpenChange(false);
      onChildAdded();
    } catch {
      toast.error(tDashboard("addChildDialog.messages.createError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const progressPercentage = (step / TOTAL_STEPS) * 100;
  const childLimitReached = childCount >= planConstraints.maxChildProfiles;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t("loading") || "Loading..."}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tDashboard("addChildDialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {childLimitReached && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              You have reached the child profile limit for your subscription plan.
            </div>
          )}

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
                  onClick={() => handleOpenChange(false)}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  {t("cancel")}
                </Button>
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
