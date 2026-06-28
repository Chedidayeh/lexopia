"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Mars, Venus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import {
  CHARACTER_TYPES,
  CHALLENGE_TYPE_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  READING_LEVELS,
  STORIES_PER_WEEK_OPTIONS,
  STORY_TONES,
} from "@/src/lib/onboarding/constants";
import type { OnboardingFormState } from "@/src/lib/onboarding/schemas";
import { ChallengeTypeInfoDialog } from "@/src/app/[locale]/onboarding/_components/challenge-type-info-dialog";
import { calculateAgeFromDate } from "@/src/lib/onboarding/schemas";
import { getAvailableChallengesByPlan, type PlanConstraints } from "@/src/lib/onboarding/plan-constraints";
import { SubscriptionPlan } from "@/src/types/types";

type OnboardingT = ReturnType<typeof useTranslations<"Onboarding">>;

type StepProps = {
  t: OnboardingT;
  form: OnboardingFormState;
  updateForm: <K extends keyof OnboardingFormState>(
    k: K,
    v: OnboardingFormState[K],
  ) => void;
  planConstraints?: PlanConstraints;
};

const GENDER_OPTIONS = [
  {
    value: "boy" as const,
    icon: Mars,
    activeClassName:
      "border-border bg-blue-100 text-blue-950 shadow-sm ring-1 ring-blue-500/20 dark:bg-blue-950/50 dark:text-blue-50 dark:ring-blue-400/25",
    idleClassName:
      "border-border bg-card text-foreground dark:bg-card",
  },
  {
    value: "girl" as const,
    icon: Venus,
    activeClassName:
      "border-border bg-rose-100 text-rose-950 shadow-sm ring-1 ring-rose-500/20 dark:bg-rose-950/50 dark:text-rose-50 dark:ring-rose-400/25",
    idleClassName:
      "border-border bg-card text-foreground dark:bg-card",
  },
] as const;

const PREDEFINED_INTERESTS = new Set<string>(INTEREST_OPTIONS);

function getInterestLabel(t: OnboardingT, interest: string) {
  return t(`interests.${interest}`, { defaultValue: interest });
}

export function ChildBasicsStep({ t, form, updateForm }: StepProps) {
  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step2Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step2Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="childName">{t("childNameLabel")}</Label>
        <Input
          id="childName"
          placeholder={t("childNamePlaceholder")}
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("childNameHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="childBirthDate">{t("birthDateLabel")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="childBirthDate"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !form.birthDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.birthDate ? (
                form.birthDate.toLocaleDateString()
              ) : (
                <span>{t("birthDatePlaceholder") || "Select a date"}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.birthDate || undefined}
              onSelect={(date) => updateForm("birthDate", date || null)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
            />
          </PopoverContent>
        </Popover>
        {form.birthDate && (
          <p className="text-xs text-muted-foreground">
            {t("ageLabel")}: {calculateAgeFromDate(form.birthDate)}
          </p>
        )}
      </div>

      <div className="flex gap-2">
{GENDER_OPTIONS.map((option) => {
  const selected = form.gender === option.value;
  const Icon = option.icon;

  const colorClasses =
    option.value === "boy"
      ? {
          border: "border-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          icon: "bg-blue-500 border-blue-500 text-white",
          check: "bg-blue-500 border-blue-500 text-white",
        }
      : {
          border: "border-rose-500",
          bg: "bg-rose-50 dark:bg-rose-950/30",
          icon: "bg-rose-500 border-rose-500 text-white",
          check: "bg-rose-500 border-rose-500 text-white",
        };

  return (
    <Button
      key={option.value}
      type="button"
      variant="outline"
      className={cn(
        "h-auto min-h-24 flex-1 justify-start rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 hover:scale-100! hover:translate-y-0!",
        selected
          ? `${colorClasses.border} ${colorClasses.bg}`
          : "border-border bg-card hover:bg-muted/40"
      )}
      onClick={() => updateForm("gender", option.value)}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
              selected
                ? colorClasses.icon
                : "border-border bg-background text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="space-y-1">
            <span className="block text-sm font-semibold">
              {t(`gender.${option.value}`)}
            </span>

            <span className="block text-xs text-muted-foreground">
              {selected ? t("selected") : t("tapToSelect")}
            </span>
          </div>
        </div>

        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
            selected
              ? colorClasses.check
              : "border-border text-transparent"
          )}
        >
          ✓
        </span>
      </div>
    </Button>
  );
})}
      </div>
    </>
  );
}

export function ReadingProfileStep({
  t,
  form,
  updateForm,
  toggleChallenge,
  planConstraints,
}: StepProps & {
  toggleChallenge: (key: "assignedChallenges", value: string) => void;
}) {
  // Get available challenges based on plan
  let availableChallengesList: string[] = CHALLENGE_TYPE_OPTIONS.map((c) => c.value);
  let planNote: string | null = null;

  if (planConstraints) {
    // Map constraints back to subscription plan
    let plan: SubscriptionPlan = SubscriptionPlan.FREE;
    if (planConstraints.challengeTypesCount === "core") {
      plan = SubscriptionPlan.PRO;
      planNote = "Pro plan includes core challenges";
    } else if (planConstraints.challengeTypesCount === "all") {
      plan = SubscriptionPlan.PRO_PLUS;
      planNote = "Pro Plus plan includes all challenges";
    } else if (planConstraints.challengeTypesCount === "basic") {
      planNote = "Free plan includes basic challenges only. Upgrade to access more challenge types.";
    }

    availableChallengesList = getAvailableChallengesByPlan(plan);
  }

  // Show ALL challenges, but disable unavailable ones
  const allChallenges = CHALLENGE_TYPE_OPTIONS;
  const unavailableChallenges = new Set(
    allChallenges
      .filter((c) => !availableChallengesList.includes(c.value))
      .map((c) => c.value)
  );

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step3Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step3Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("primaryLanguageLabel")}</Label>
        <Select
          value={form.primaryLanguage}
          onValueChange={(v) =>
            updateForm(
              "primaryLanguage",
              v as OnboardingFormState["primaryLanguage"],
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectLanguagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.filter((lang) => lang.value === "EN").map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {t(lang.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("readingLevelLabel")}</Label>
        <Select
          value={form.readingLevel}
          onValueChange={(v) =>
            updateForm("readingLevel", v as OnboardingFormState["readingLevel"])
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("readingLevelPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {READING_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {t(level.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("assignedChallengesLabel")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("assignedChallengesDesc")}
        </p>
        {planNote && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            {planNote}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allChallenges.map((challenge) => {
            const isUnavailable = unavailableChallenges.has(challenge.value);
            const isSelected = form.assignedChallenges.includes(challenge.value);

            return (
              <div
                key={challenge.value}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 transition-all",
                  isUnavailable
                    ? "opacity-60 bg-muted/30 cursor-not-allowed border-muted"
                    : "hover:bg-muted/40"
                )}
              >
                <label
                  className={cn(
                    "flex flex-1 items-center gap-2 cursor-pointer min-w-0",
                    isUnavailable && "cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (!isUnavailable) {
                        toggleChallenge("assignedChallenges", challenge.value);
                      }
                    }}
                    disabled={isUnavailable}
                  />
                  <span className="text-sm">{t(challenge.labelKey)}</span>
                  {isUnavailable && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      (Locked)
                    </span>
                  )}
                </label>
                <ChallengeTypeInfoDialog
                  labelKey={challenge.labelKey}
                  infoKey={challenge.infoKey}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function InterestsStep({
  t,
  form,
  updateForm,
  toggleInterest,
  planConstraints,
}: StepProps & {
  toggleInterest: (key: "interests", value: string) => void;
}) {
  const [customTheme, setCustomTheme] = useState("");

  const maxThemes = planConstraints?.maxThemes ?? 5;
  const normalizedCustomTheme = customTheme.trim().replace(/\s+/g, " ");
  const canAddCustomTheme =
    normalizedCustomTheme.length > 0 && form.interests.length < maxThemes;

  function addCustomTheme() {
    if (!canAddCustomTheme) return;

    const alreadySelected = form.interests.some(
      (interest) => interest.toLowerCase() === normalizedCustomTheme.toLowerCase(),
    );

    if (alreadySelected) {
      setCustomTheme("");
      return;
    }

    toggleInterest("interests", normalizedCustomTheme);
    setCustomTheme("");
  }

  const themesReachedLimit = form.interests.length >= maxThemes;

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step4Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step4Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("favoriteThemesLabel")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("interestsHint")} ({form.interests.length}/{maxThemes})
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = form.interests.includes(interest);
            return (
              <Button
                key={interest}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() => {
                  if (!selected && form.interests.length >= maxThemes) {
                    return;
                  }
                  toggleInterest("interests", interest);
                }}
                disabled={!selected && form.interests.length >= maxThemes}
              >
                {getInterestLabel(t, interest)}
              </Button>
            );
          })}
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="customTheme">{t("addCustomThemeLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="customTheme"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTheme();
                }
              }}
              placeholder={t("addCustomThemePlaceholder")}
              disabled={themesReachedLimit && !customTheme}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomTheme}
              disabled={!canAddCustomTheme}
            >
              {t("addCustomThemeButton")}
            </Button>
          </div>
          {themesReachedLimit && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("maxThemesReached", { max: maxThemes })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {form.interests.length >= 5
              ? t("maxInterests")
              : t("addCustomThemeHint")}
          </p>
        </div>

        {form.interests.some((interest) => !PREDEFINED_INTERESTS.has(interest)) && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("customThemesSelected")}
            </p>
            <div className="flex flex-wrap gap-2">
              {form.interests
                .filter((interest) => !PREDEFINED_INTERESTS.has(interest))
                .map((interest) => (
                  <Button
                    key={interest}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleInterest("interests", interest)}
                  >
                    {interest}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("characterTypeLabel")}</Label>
        <Select
          value={form.favoriteCharacterType}
          onValueChange={(v) => updateForm("favoriteCharacterType", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("characterTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {CHARACTER_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {t(c.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("storyToneLabel")}</Label>
        <Select
          value={form.storyTone}
          onValueChange={(v) => updateForm("storyTone", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("storyTonePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {STORY_TONES.map((tone) => (
              <SelectItem key={tone.value} value={tone.value}>
                {t(tone.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function GoalsLaunchStep({ t, form, updateForm, planConstraints }: StepProps) {
  // Get max stories per week from plan
  const maxStoriesPerWeek = planConstraints?.maxStoriesPerWeek ?? 7;
  const availableStoriesPerWeek = STORIES_PER_WEEK_OPTIONS.filter(
    (n) => n <= maxStoriesPerWeek
  );

  let planNote: string | null = null;
  if (planConstraints) {
    if (maxStoriesPerWeek === 1) {
      planNote = "Free plan allows up to 1 story per week";
    } else if (maxStoriesPerWeek === 3) {
      planNote = "Pro plan allows up to 3 stories per week";
    } else if (maxStoriesPerWeek === 7) {
      planNote = "Pro Plus plan allows up to 7 stories per week";
    }
  }

  // Reset to valid value if current selection exceeds max
  useEffect(() => {
    if (form.storiesPerWeek > maxStoriesPerWeek) {
      updateForm("storiesPerWeek", maxStoriesPerWeek);
    }
  }, [maxStoriesPerWeek, form.storiesPerWeek, updateForm]);

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step5Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step5Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label>
          {t("storiesPerWeekLabel", {
            childName: form.name || "your child",
          })}
        </Label>
        {planNote && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            {planNote}
          </p>
        )}
        <Select
          value={String(form.storiesPerWeek)}
          onValueChange={(v) => updateForm("storiesPerWeek", Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableStoriesPerWeek.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {t("storiesPerWeekOption", { count: n })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
        <Checkbox
          checked={form.activateNotifications}
          onCheckedChange={(checked) =>
            updateForm("activateNotifications", checked === true)
          }
        />
        <div>
          <p className="text-sm font-medium">{t("enableReadingReminders")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("enableRemindersDescription", {
              childName: form.name || "your child",
            })}
          </p>
        </div>
      </label>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
        <h3 className="font-semibold">{t("summaryTitle")}</h3>
        <p className="text-muted-foreground text-xs">{t("summaryDesc")}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <SummaryItem label={t("childNameLabel")} value={form.name} />
          <SummaryItem 
            label={t("ageLabel")} 
            value={form.birthDate ? String(calculateAgeFromDate(form.birthDate)) : ""} 
          />
          <SummaryItem
            label={t("readingLevelLabel")}
            value={t(
              READING_LEVELS.find((l) => l.value === form.readingLevel)
                ?.labelKey ?? "readingLevelBeginner",
            )}
          />
          <SummaryItem
            label={t("favoriteThemesLabel")}
            value={form.interests.map((i) => getInterestLabel(t, i)).join(", ")}
            className="col-span-2"
          />
        </dl>
      </div>
    </>
  );
}

function SummaryItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
