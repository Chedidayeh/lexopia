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
import { LanguageCode, ReadingLevel } from "@/src/types/types";

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

const interestSchema = z.enum(
  [...INTEREST_OPTIONS] as [string, ...string[]],
  { message: "invalidInterest" },
);

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
  age: z
    .number({ message: "invalidAge" })
    .int("invalidAge")
    .min(MIN_CHILD_AGE, "invalidAge")
    .max(MAX_CHILD_AGE, "invalidAge"),
  gender: z.enum(["boy", "girl"], { message: "selectGender" }),
});

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
  age: number;
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
  age: 8,
  gender: "",
  primaryLanguage: "EN",
  readingLevel: "BEGINNER",
  assignedChallenges: [],
  interests: [],
  favoriteCharacterType: "",
  storyTone: "",
  storiesPerWeek: 3,
  sessionDurationMins: 20,
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
  data: Pick<OnboardingFormState, "name" | "age" | "gender">,
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

export function validateOnboardingForm(
  data: OnboardingFormState,
): StepValidationResult {
  return parseWithSchema(onboardingFormSchema, data);
}

export function parseOnboardingForm(data: unknown) {
  return onboardingFormSchema.safeParse(data);
}
