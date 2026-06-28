"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Mars, Venus } from "lucide-react";
import { motion } from "framer-motion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { BookOpen, Target, Users, TrendingUp, RefreshCw, Play, ChevronDown } from "lucide-react";
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
  updateForm?: <K extends keyof OnboardingFormState>(
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

export function IntroStep({ t }: StepProps) {
  return (
    <div className="space-y-8 pb-">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("introTitle")}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t("introSubtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featurePersonalizedStories")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featurePersonalizedStoriesDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featureReadingPlan")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featureReadingPlanDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featureParentRole")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featureParentRoleDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featureGeneratePlan")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featureGeneratePlanDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featureGenerateStory")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featureGenerateStoryDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {t("featureMonitorProgress")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("featureMonitorProgressDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {t("introReadyToStart")}
        </p>
      </div>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-black bg-primary backdrop-blur-sm rounded-full p-2 shadow-lg"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </div>
    </div>
  );
}

export function NameStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("childNameLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("childNameHint")}</p>
      </div>
      <Input
        placeholder={t("childNamePlaceholder")}
        value={form.name}
        onChange={(e) => updateForm?.("name", e.target.value)}
        className="text-lg h-12"
        autoFocus
      />
    </div>
  );
}

export function BirthDateStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("birthDateLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("birthDatePlaceholder")}</p>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12 text-lg",
              !form.birthDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
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
            onSelect={(date) => updateForm?.("birthDate", date || null)}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
          />
        </PopoverContent>
      </Popover>
      {form.birthDate && (
        <p className="text-sm text-muted-foreground">
          {t("ageLabel")}: {calculateAgeFromDate(form.birthDate)}
        </p>
      )}
    </div>
  );
}

export function GenderStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("selectGender")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("tapToSelect")}</p>
      </div>
      <div className="flex gap-3">
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
                "h-auto min-h-32 flex-1 justify-start rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200",
                selected
                  ? `${colorClasses.border} ${colorClasses.bg}`
                  : "border-border bg-card hover:bg-muted/40"
              )}
              onClick={() => updateForm?.("gender", option.value)}
            >
              <div className="flex w-full flex-col items-center justify-center gap-3">
                <span
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full border transition-colors",
                    selected
                      ? colorClasses.icon
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  <Icon className="h-8 w-8" />
                </span>
                <span className="block text-lg font-semibold">
                  {t(`gender.${option.value}`)}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function LanguageStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("primaryLanguageLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("selectLanguagePlaceholder")}</p>
      </div>
      <Select
        value={form.primaryLanguage}
        onValueChange={(v) =>
          updateForm?.(
            "primaryLanguage",
            v as OnboardingFormState["primaryLanguage"],
          )
        }
      >
        <SelectTrigger className="h-12 text-lg">
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
  );
}

export function ReadingLevelStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("readingLevelLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("readingLevelPlaceholder")}</p>
      </div>
      <Select
        value={form.readingLevel}
        onValueChange={(v) => updateForm?.("readingLevel", v as OnboardingFormState["readingLevel"])}
      >
        <SelectTrigger className="h-12 text-lg">
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
  );
}

export function ChallengesStep({
  t,
  form,
  updateForm,
  toggleChallenge,
  planConstraints,
}: StepProps & {
  toggleChallenge: (key: "assignedChallenges", value: string) => void;
}) {
  const router = useRouter();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [lockedChallengeName, setLockedChallengeName] = useState("");
  const [learnMoreDialogOpen, setLearnMoreDialogOpen] = useState(false);

  let availableChallengesList: string[] = CHALLENGE_TYPE_OPTIONS.map((c) => c.value);
  let planNote: string | null = null;

  if (planConstraints) {
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

  const allChallenges = CHALLENGE_TYPE_OPTIONS;
  const unavailableChallenges = new Set(
    allChallenges
      .filter((c) => !availableChallengesList.includes(c.value))
      .map((c) => c.value)
  );

  const handleChallengeClick = (challenge: { value: string; labelKey: string }) => {
    if (unavailableChallenges.has(challenge.value as any)) {
      setLockedChallengeName(t(challenge.labelKey));
      setUpgradeDialogOpen(true);
    } else {
      toggleChallenge("assignedChallenges", challenge.value as any);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("assignedChallengesLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("assignedChallengesDesc")}</p>
      </div>
      {planNote && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
          {planNote}
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setLearnMoreDialogOpen(true)}
        className="text-primary hover:text-primary/80"
      >
        Learn about challenges
      </Button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allChallenges.map((challenge) => {
          const isUnavailable = unavailableChallenges.has(challenge.value);
          const isSelected = form.assignedChallenges.includes(challenge.value);

          return (
            <div
              key={challenge.value}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-all cursor-pointer",
                isUnavailable
                  ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800"
                  : "hover:bg-muted/40 border-primary/20 bg-primary/5"
              )}
              onClick={() => handleChallengeClick(challenge)}
            >
              <Checkbox
                checked={isSelected}
                disabled={isUnavailable}
                className={cn(
                  isUnavailable && "opacity-50"
                )}
              />
              <span className={cn(
                "text-base flex-1",
                isUnavailable && "text-muted-foreground"
              )}>
                {t(challenge.labelKey)}
              </span>
              {isUnavailable && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Upgrade
                </span>
              )}
              <ChallengeTypeInfoDialog
                labelKey={challenge.labelKey}
                infoKey={challenge.infoKey}
              />
            </div>
          );
        })}
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Required</DialogTitle>
            <DialogDescription>
              The challenge type "{lockedChallengeName}" is not available in your current plan. Upgrade to Pro or Pro Plus to access all challenge types.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Maybe Later
            </Button>
            <Button onClick={() => {
              setUpgradeDialogOpen(false);
              router.push("/#pricing");
            }}>
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={learnMoreDialogOpen} onOpenChange={setLearnMoreDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learn About Challenges</DialogTitle>
            <DialogDescription>
              Understanding the different challenge types helps you choose the best ones for your child's learning journey.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Challenge</th>
                  <th className="text-left p-3 font-semibold">Purpose</th>
                  <th className="text-left p-3 font-semibold">How it works</th>
                </tr>
              </thead>
              <tbody>
                {allChallenges.map((challenge) => (
                  <tr key={challenge.value} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{t(challenge.labelKey)}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {t(`challengeTypeInfo.${challenge.infoKey}.purpose`)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {t(`challengeTypeInfo.${challenge.infoKey}.howItWorks`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button onClick={() => setLearnMoreDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("favoriteThemesLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t("interestsHint")} ({form.interests.length}/{maxThemes})
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = form.interests.includes(interest);
          return (
            <Button
              key={interest}
              type="button"
              size="lg"
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
      </div>
    </div>
  );
}

export function CharacterTypeStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("characterTypeLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("characterTypePlaceholder")}</p>
      </div>
      <Select
        value={form.favoriteCharacterType}
        onValueChange={(v) => updateForm?.("favoriteCharacterType", v)}
      >
        <SelectTrigger className="h-12 text-lg">
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
  );
}

export function StoryToneStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("storyToneLabel")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("storyTonePlaceholder")}</p>
      </div>
      <Select
        value={form.storyTone}
        onValueChange={(v) => updateForm?.("storyTone", v)}
      >
        <SelectTrigger className="h-12 text-lg">
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
  );
}

export function StoriesPerWeekStep({ t, form, updateForm, planConstraints }: StepProps) {
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">
          {t("storiesPerWeekLabel", {
            childName: form.name || "your child",
          })}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">{t("selectReadingFrequency")}</p>
      </div>
      {planNote && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
          {planNote}
        </p>
      )}
      <Select
        value={String(form.storiesPerWeek)}
        onValueChange={(v) => updateForm?.("storiesPerWeek", Number(v))}
      >
        <SelectTrigger className="h-12 text-lg">
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
  );
}

export function NotificationsStep({ t, form, updateForm }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{t("enableReadingReminders")}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t("enableRemindersDescription", {
            childName: form.name || "your child",
          })}
        </p>
      </div>
      <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
        <Checkbox
          checked={form.activateNotifications}
          onCheckedChange={(checked) =>
            updateForm?.("activateNotifications", checked === true)
          }
        />
        <div>
          <p className="text-base font-medium">{t("enableReadingReminders")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("enableRemindersDescription", {
              childName: form.name || "your child",
            })}
          </p>
        </div>
      </label>
    </div>
  );
}

export function OverviewStep({ t, form }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("summaryTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("summaryDesc")}</p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">{t("childNameLabel")}</dt>
            <dd className="text-lg font-medium">{form.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("ageLabel")}</dt>
            <dd className="text-lg font-medium">
              {form.birthDate ? String(calculateAgeFromDate(form.birthDate)) : ""}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("selectGender")}</dt>
            <dd className="text-lg font-medium">{t(`gender.${form.gender}`)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("readingLevelLabel")}</dt>
            <dd className="text-lg font-medium">
              {t(
                READING_LEVELS.find((l) => l.value === form.readingLevel)
                  ?.labelKey ?? "readingLevelBeginner",
              )}
            </dd>
          </div>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">{t("favoriteThemesLabel")}</dt>
          <dd className="text-base font-medium">
            {form.interests.map((i) => getInterestLabel(t, i)).join(", ")}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">{t("characterTypeLabel")}</dt>
          <dd className="text-base font-medium">
            {t(
              CHARACTER_TYPES.find((c) => c.value === form.favoriteCharacterType)
                ?.labelKey ?? "",
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">{t("storyToneLabel")}</dt>
          <dd className="text-base font-medium">
            {t(
              STORY_TONES.find((t) => t.value === form.storyTone)
                ?.labelKey ?? "",
            )}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-muted-foreground">{t("storiesPerWeekLabel", { childName: form.name || "your child" })}</dt>
          <dd className="text-base font-medium">{form.storiesPerWeek} per week</dd>
        </div>
      </div>
    </div>
  );
}
