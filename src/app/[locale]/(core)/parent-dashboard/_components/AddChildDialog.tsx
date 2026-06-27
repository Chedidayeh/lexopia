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
  validateStep2,
  validateStep3WithPlan,
  validateStep4WithPlan,
  validateStep5WithPlan,
  validateOnboardingFormWithPlan,
} from "@/src/lib/onboarding/schemas";
import {
  ChildBasicsStep,
  GoalsLaunchStep,
  InterestsStep,
  ReadingProfileStep,
} from "@/src/lib/onboarding/onboarding-steps";
import {
  getPlanConstraints,
  type PlanConstraints,
} from "@/src/lib/onboarding/plan-constraints";
import { SubscriptionPlan } from "@/src/types/types";
import { addChildAction } from "../actions/add-child-actions";
import { getChildProfilesByParentAction } from "@/src/lib/progress-service/server-actions";
import type { User } from "@/src/lib/dashboard/types";

const TOTAL_STEPS = 4;

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
      () => validateStep2(form),
      () =>
        validateStep3WithPlan(
          {
            primaryLanguage: form.primaryLanguage,
            readingLevel: form.readingLevel,
            assignedChallenges: form.assignedChallenges,
          },
          planConstraints,
        ),
      () =>
        validateStep4WithPlan(
          {
            interests: form.interests,
            favoriteCharacterType: form.favoriteCharacterType,
            storyTone: form.storyTone,
          },
          planConstraints,
        ),
      () =>
        validateStep5WithPlan(
          {
            storiesPerWeek: form.storiesPerWeek,
            sessionDurationMins: form.sessionDurationMins,
            activateNotifications: form.activateNotifications,
          },
          planConstraints,
        ),
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

          <div className="mb-6">
            <div className="flex justify-between mb-3">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <motion.div
                  key={s}
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                        ? "bg-primary/70 text-primary-foreground border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                  animate={{ scale: s === step ? 1.1 : 1 }}
                >
                  {s < step ? <CircleCheck className="w-4 h-4" /> : s}
                </motion.div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
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
                  planConstraints={planConstraints}
                />
              )}
              {step === 3 && (
                <InterestsStep
                  t={t}
                  form={form}
                  updateForm={updateForm}
                  toggleInterest={toggleArrayItem}
                  planConstraints={planConstraints}
                />
              )}
              {step === 4 && (
                <GoalsLaunchStep
                  t={t}
                  form={form}
                  updateForm={updateForm}
                  planConstraints={planConstraints}
                />
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
                  {step === 1
                    ? tDashboard("addChildDialog.buttons.cancel")
                    : t("previous")}
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    {t("next")}
                    <NextIcon className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    onClick={handleComplete}
                    disabled={isSubmitting || childLimitReached}
                  >
                    {isSubmitting
                      ? tDashboard("addChildDialog.step3.creating")
                      : childLimitReached
                        ? "Plan limit reached"
                        : tDashboard("addChildDialog.step3.createButton")}
                    {!isSubmitting && !childLimitReached && (
                      <NextIcon className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("stepOf", { step, total: TOTAL_STEPS })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
