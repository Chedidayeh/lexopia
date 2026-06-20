"use client";

import { useState } from "react";
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
import { addChildAction } from "../actions/add-child-actions";
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
  onChildAdded,
}: AddChildDialogProps) {
  const t = useTranslations("Onboarding");
  const tDashboard = useTranslations("ParentDashboard");
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
    const validation = validateOnboardingForm(form);
    if (!validation.valid) {
      toast.error(t(validation.message));
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tDashboard("addChildDialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? tDashboard("addChildDialog.step3.creating")
                      : tDashboard("addChildDialog.step3.createButton")}
                    {!isSubmitting && <NextIcon className="w-4 h-4 ml-2" />}
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
