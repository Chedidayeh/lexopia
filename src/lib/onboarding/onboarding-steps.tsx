"use client";

import { useTranslations } from "next-intl";
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
import {
  CHARACTER_TYPES,
  CHALLENGE_TYPE_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_CHILD_AGE,
  MIN_CHILD_AGE,
  READING_LEVELS,
  SESSION_DURATIONS,
  STORIES_PER_WEEK_OPTIONS,
  STORY_TONES,
} from "@/src/lib/onboarding/constants";
import type { OnboardingFormState } from "@/src/lib/onboarding/schemas";
import { ChallengeTypeInfoDialog } from "@/src/app/[locale]/onboarding/_components/challenge-type-info-dialog";

type OnboardingT = ReturnType<typeof useTranslations<"Onboarding">>;

type StepProps = {
  t: OnboardingT;
  form: OnboardingFormState;
  updateForm: <K extends keyof OnboardingFormState>(
    k: K,
    v: OnboardingFormState[K],
  ) => void;
};

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
        <Label htmlFor="childAge">{t("ageLabel")}</Label>
        <Input
          id="childAge"
          type="number"
          min={MIN_CHILD_AGE}
          max={MAX_CHILD_AGE}
          value={form.age}
          onChange={(e) => updateForm("age", Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("genderLabel")}</Label>
        <div className="flex gap-3">
          {(["boy", "girl"] as const).map((g) => {
            const selected = form.gender === g;
            return (
              <Button
                key={g}
                type="button"
                variant="outline"
                className={cn(
                  "flex-1",
                  g === "boy"
                    ? selected
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                      : "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    : selected
                      ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
                      : "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40",
                )}
                onClick={() => updateForm("gender", g)}
              >
                {t(`gender.${g}`)}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function ReadingProfileStep({
  t,
  form,
  updateForm,
  toggleChallenge,
}: StepProps & {
  toggleChallenge: (key: "assignedChallenges", value: string) => void;
}) {
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
            {LANGUAGE_OPTIONS.map((lang) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHALLENGE_TYPE_OPTIONS.map((challenge) => (
            <div
              key={challenge.value}
              className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/40"
            >
              <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                <Checkbox
                  checked={form.assignedChallenges.includes(challenge.value)}
                  onCheckedChange={() =>
                    toggleChallenge("assignedChallenges", challenge.value)
                  }
                />
                <span className="text-sm">{t(challenge.labelKey)}</span>
              </label>
              <ChallengeTypeInfoDialog
                labelKey={challenge.labelKey}
                infoKey={challenge.infoKey}
              />
            </div>
          ))}
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
}: StepProps & {
  toggleInterest: (key: "interests", value: string) => void;
}) {
  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step4Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step4Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("favoriteThemesLabel")}</Label>
        <p className="text-xs text-muted-foreground">{t("interestsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = form.interests.includes(interest);
            return (
              <Button
                key={interest}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() => toggleInterest("interests", interest)}
              >
                {t(`interests.${interest}`)}
              </Button>
            );
          })}
        </div>
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

export function GoalsLaunchStep({ t, form, updateForm }: StepProps) {
  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{t("step5Title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("step5Desc")}</p>
      </div>

      <div className="space-y-2">
        <Label>
          {t("storiesPerWeekLabel", {
            childName: form.name || t("childNamePlaceholder"),
          })}
        </Label>
        <Select
          value={String(form.storiesPerWeek)}
          onValueChange={(v) => updateForm("storiesPerWeek", Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STORIES_PER_WEEK_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {t("storiesPerWeekOption", { count: n })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("sessionDurationLabel")}</Label>
        <Select
          value={String(form.sessionDurationMins)}
          onValueChange={(v) => updateForm("sessionDurationMins", Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSION_DURATIONS.map((mins) => (
              <SelectItem key={mins} value={String(mins)}>
                {t("sessionDurationOption", { mins })}
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
              childName: form.name || t("childNamePlaceholder"),
            })}
          </p>
        </div>
      </label>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
        <h3 className="font-semibold">{t("summaryTitle")}</h3>
        <p className="text-muted-foreground text-xs">{t("summaryDesc")}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <SummaryItem label={t("childNameLabel")} value={form.name} />
          <SummaryItem label={t("ageLabel")} value={String(form.age)} />
          <SummaryItem
            label={t("readingLevelLabel")}
            value={t(
              READING_LEVELS.find((l) => l.value === form.readingLevel)
                ?.labelKey ?? "readingLevelBeginner",
            )}
          />
          <SummaryItem
            label={t("sessionDurationLabel")}
            value={t("sessionDurationOption", {
              mins: form.sessionDurationMins,
            })}
          />
          <SummaryItem
            label={t("favoriteThemesLabel")}
            value={form.interests.map((i) => t(`interests.${i}`)).join(", ")}
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
