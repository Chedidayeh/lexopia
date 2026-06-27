import { z } from "zod";
import {
  CHARACTER_TYPES,
  CHALLENGE_TYPE_OPTIONS,
  INTEREST_OPTIONS,
  MAX_CHILD_AGE,
  MIN_CHILD_AGE,
  SESSION_DURATIONS,
  STORIES_PER_WEEK_OPTIONS,
  STORY_TONES,
} from "./constants";
import { LanguageCode, ReadingLevel, SubscriptionPlan } from "@/src/types/types";
import { getPlanConstraints, getAvailableChallengesByPlan, type PlanConstraints } from "./plan-constraints";

const languageCodeSchema = z.enum(
  [LanguageCode.EN, LanguageCode.FR, LanguageCode.AR],
  { message: "selectLanguageRequired" },
);

const readingLevelSchema = z.enum(
  [
    ReadingLevel.BEGINNER,
    ReadingLevel.EASY,
    ReadingLevel.MEDIUM,
    ReadingLevel.HARD,
    ReadingLevel.ADVANCED,
  ],
  { message: "selectReadingLevel" },
);

const challengeTypeValues = CHALLENGE_TYPE_OPTIONS.map((c) => c.value);
const challengeTypeSchema = z.enum(
  challengeTypeValues as [string, ...string[]],
  { message: "invalidChallenge" },
);

const interestSchema = z
  .string({ message: "invalidInterest" })
  .trim()
  .min(1, "invalidInterest")
  .max(40, "invalidInterest");

const characterTypeValues = CHARACTER_TYPES.map((c) => c.value);
const characterTypeSchema = z.enum(
  characterTypeValues as [string, ...string[]],
  { message: "selectCharacterType" },
);

const storyToneValues = STORY_TONES.map((t) => t.value);
const storyToneSchema = z.enum(
  storyToneValues as [string, ...string[]],
  { message: "selectStoryTone" },
);

export const onboardingStep2Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "childNameRequired")
    .max(30, "childNameRequired"),
  birthDate: z
    .date({ message: "invalidBirthDate" })
    .refine(
      (date) => {
        const age = calculateAgeFromDate(date);
        return age >= MIN_CHILD_AGE && age <= MAX_CHILD_AGE;
      },
      { message: "invalidBirthDate" }
    ),
  gender: z.enum(["boy", "girl"], { message: "selectGender" }),
});

export function calculateAgeFromDate(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const onboardingStep3Schema = z.object({
  primaryLanguage: languageCodeSchema,
  readingLevel: readingLevelSchema,
  assignedChallenges: z
    .array(challengeTypeSchema)
    .min(1, "selectAtLeastOneChallenge"),
});

export const onboardingStep4Schema = z.object({
  interests: z
    .array(interestSchema)
    .min(1, "selectAtLeastOneTheme")
    .max(5, "maxInterests"),
  favoriteCharacterType: characterTypeSchema,
  storyTone: storyToneSchema,
});

// Plan-aware schema builders
export function createStep3SchemaWithPlan(constraints: PlanConstraints) {
  // Map constraints to the corresponding plan to get available challenges
  let plan = SubscriptionPlan.FREE;
  if (constraints.challengeTypesCount === "core") {
    plan = SubscriptionPlan.PRO;
  } else if (constraints.challengeTypesCount === "all") {
    plan = SubscriptionPlan.PRO_PLUS;
  }

  const availableChallenges = getAvailableChallengesByPlan(plan);

  return z.object({
    primaryLanguage: languageCodeSchema,
    readingLevel: readingLevelSchema,
    assignedChallenges: z
      .array(challengeTypeSchema)
      .min(1, "selectAtLeastOneChallenge")
      .refine(
        (challenges) => challenges.every((c) => availableChallenges.includes(c)),
        "invalidChallenge"
      ),
  });
}

export function createStep4SchemaWithPlan(constraints: PlanConstraints) {
  return z.object({
    interests: z
      .array(interestSchema)
      .min(1, "selectAtLeastOneTheme")
      .max(constraints.maxThemes, "maxInterests"),
    favoriteCharacterType: characterTypeSchema,
    storyTone: storyToneSchema,
  });
}

export function createStep5SchemaWithPlan(constraints: PlanConstraints) {
  return z.object({
    storiesPerWeek: z
      .number({ message: "selectReadingFrequency" })
      .refine(
        (v) => v <= constraints.maxStoriesPerWeek && (STORIES_PER_WEEK_OPTIONS as readonly number[]).includes(v),
        "selectReadingFrequency",
      ),
    sessionDurationMins: z
      .number({ message: "selectSessionDuration" })
      .refine(
        (v) => (SESSION_DURATIONS as readonly number[]).includes(v),
        "selectSessionDuration",
      ),
    activateNotifications: z.boolean(),
  });
}

export const onboardingStep5Schema = z.object({
  storiesPerWeek: z
    .number({ message: "selectReadingFrequency" })
    .refine(
      (v) => (STORIES_PER_WEEK_OPTIONS as readonly number[]).includes(v),
      "selectReadingFrequency",
    ),
  sessionDurationMins: z
    .number({ message: "selectSessionDuration" })
    .refine(
      (v) => (SESSION_DURATIONS as readonly number[]).includes(v),
      "selectSessionDuration",
    ),
  activateNotifications: z.boolean(),
});

export const onboardingFormSchema = onboardingStep2Schema
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema)
  .merge(onboardingStep5Schema);

/** Validated onboarding payload (after Zod parse). */
export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

/** In-progress wizard state — allows empty fields until step validation. */
export type OnboardingFormState = {
  name: string;
  birthDate: Date | null;
  gender: string;
  primaryLanguage: OnboardingFormData["primaryLanguage"];
  readingLevel: OnboardingFormData["readingLevel"];
  assignedChallenges: string[];
  interests: string[];
  favoriteCharacterType: string;
  storyTone: string;
  storiesPerWeek: number;
  sessionDurationMins: number;
  activateNotifications: boolean;
};

export const INITIAL_ONBOARDING_FORM: OnboardingFormState = {
  name: "",
  birthDate: null,
  gender: "",
  primaryLanguage: "EN",
  readingLevel: "BEGINNER",
  assignedChallenges: [],
  interests: [],
  favoriteCharacterType: "",
  storyTone: "",
  storiesPerWeek: 1,
  sessionDurationMins: 10,
  activateNotifications: false,
};

export type StepValidationResult =
  | { valid: true }
  | { valid: false; field: string; message: string };

function firstZodIssue(error: z.ZodError): StepValidationResult {
  const issue = error.issues[0];
  return {
    valid: false,
    field: issue.path.join(".") || "form",
    message: issue.message,
  };
}

function parseWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): StepValidationResult {
  const result = schema.safeParse(data);
  if (result.success) return { valid: true };
  return firstZodIssue(result.error);
}

export function validateStep2(
  data: Pick<OnboardingFormState, "name" | "birthDate" | "gender">,
): StepValidationResult {
  return parseWithSchema(onboardingStep2Schema, data);
}

export function validateStep3(
  data: Pick<
    OnboardingFormState,
    "primaryLanguage" | "readingLevel" | "assignedChallenges"
  >,
): StepValidationResult {
  return parseWithSchema(onboardingStep3Schema, data);
}

export function validateStep4(
  data: Pick<
    OnboardingFormState,
    "interests" | "favoriteCharacterType" | "storyTone"
  >,
): StepValidationResult {
  return parseWithSchema(onboardingStep4Schema, data);
}

export function validateStep5(
  data: Pick<
    OnboardingFormState,
    "storiesPerWeek" | "sessionDurationMins" | "activateNotifications"
  >,
): StepValidationResult {
  return parseWithSchema(onboardingStep5Schema, data);
}

// Plan-aware validation functions
export function validateStep5WithPlan(
  data: Pick<
    OnboardingFormState,
    "storiesPerWeek" | "sessionDurationMins" | "activateNotifications"
  >,
  constraints: PlanConstraints,
): StepValidationResult {
  const schema = createStep5SchemaWithPlan(constraints);
  return parseWithSchema(schema, data);
}

export function validateStep3WithPlan(
  data: Pick<
    OnboardingFormState,
    "primaryLanguage" | "readingLevel" | "assignedChallenges"
  >,
  constraints: PlanConstraints,
): StepValidationResult {
  const schema = createStep3SchemaWithPlan(constraints);
  return parseWithSchema(schema, data);
}

export function validateStep4WithPlan(
  data: Pick<
    OnboardingFormState,
    "interests" | "favoriteCharacterType" | "storyTone"
  >,
  constraints: PlanConstraints,
): StepValidationResult {
  const schema = createStep4SchemaWithPlan(constraints);
  return parseWithSchema(schema, data);
}

export function validateOnboardingFormWithPlan(
  data: OnboardingFormState,
  constraints: PlanConstraints,
): StepValidationResult {
  const step2Valid = validateStep2({
    name: data.name,
    birthDate: data.birthDate,
    gender: data.gender,
  });
  if (!step2Valid.valid) return step2Valid;

  const step3Valid = validateStep3WithPlan(
    {
      primaryLanguage: data.primaryLanguage,
      readingLevel: data.readingLevel,
      assignedChallenges: data.assignedChallenges,
    },
    constraints
  );
  if (!step3Valid.valid) return step3Valid;

  const step4Valid = validateStep4WithPlan(
    {
      interests: data.interests,
      favoriteCharacterType: data.favoriteCharacterType,
      storyTone: data.storyTone,
    },
    constraints
  );
  if (!step4Valid.valid) return step4Valid;

  const step5Valid = validateStep5WithPlan(
    {
      storiesPerWeek: data.storiesPerWeek,
      sessionDurationMins: data.sessionDurationMins,
      activateNotifications: data.activateNotifications,
    },
    constraints
  );
  return step5Valid;
}

export function validateOnboardingForm(
  data: OnboardingFormState,
): StepValidationResult {
  return parseWithSchema(onboardingFormSchema, data);
}

export function parseOnboardingForm(data: unknown) {
  return onboardingFormSchema.safeParse(data);
}
