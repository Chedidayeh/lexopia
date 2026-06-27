

// ============================================================================
// ENUMS
// ============================================================================

export const TranslationSourceType = {
  EN_TO_FR_AR: "en_to_fr_ar", // Auto-translate from English
  FR_TO_AR_EN: "fr_to_ar_en", // Auto-translate from French
  MANUAL: "manual", // Manual translations
} as const;
export type TranslationSourceType =
  (typeof TranslationSourceType)[keyof typeof TranslationSourceType];

export const RoleType = {
  PARENT: "PARENT",
  ADMIN: "ADMIN",
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];

export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  PRO_PLUS: "PRO_PLUS",
} as const;

export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const LanguageCode = {
  EN: "EN",
  AR: "AR",
  FR: "FR",
} as const;

export type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode];

export const TTSLanguageCodes = {
  ENGLISH_US: "en-us",
  ARABIC: "ar-001",
  FRENCH: "fr-fr",
} as const;

export type TTSLanguageCodes =
  (typeof TTSLanguageCodes)[keyof typeof TTSLanguageCodes];

export const Local = {
  EN: "en",
  AR: "ar",
  FR: "fr",
} as const;

export type Local = (typeof Local)[keyof typeof Local];

export const ChallengeType = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE", // comprehension; predefined optionId answer
  TRUE_FALSE: "TRUE_FALSE", // predefined boolean answer
  SEQUENCING: "SEQUENCING", // predefined ordered itemId[] answer
  FILL_BLANK: "FILL_BLANK", // predefined wordId from bank
  COMPLETE_WORD: "COMPLETE_WORD", // predefined letterId(s) for gap(s)
  LETTER_DISCRIMINATION: "LETTER_DISCRIMINATION", // predefined letterId answer
  SOUND_MATCH: "SOUND_MATCH", // predefined optionId for phoneme match
  READ_ALOUD: "READ_ALOUD", // predefined targetWord; speech-to-text match
  WORD_BUILD: "WORD_BUILD", // predefined letterIds[] in order to form target word
} as const;

export type ChallengeType = (typeof ChallengeType)[keyof typeof ChallengeType];

export const ProgressStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type ProgressStatus =
  (typeof ProgressStatus)[keyof typeof ProgressStatus];

export const ContentStatus = {
  LOCKED: "LOCKED",
  AVAILABLE: "AVAILABLE",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type ContentStatus =
  (typeof ContentStatus)[keyof typeof ContentStatus];

export const ChallengeStatus = {
  SOLVED: "SOLVED",
  SKIPPED: "SKIPPED",
  INCORRECT: "INCORRECT",
  NOT_ATTEMPTED: "NOT_ATTEMPTED",
} as const;

export type ChallengeStatus =
  (typeof ChallengeStatus)[keyof typeof ChallengeStatus];

export const ReadingLevel = {
  BEGINNER: "BEGINNER",
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
  ADVANCED: "ADVANCED",
} as const;

export type ReadingLevel = (typeof ReadingLevel)[keyof typeof ReadingLevel];

export const AgeGroupStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type AgeGroupStatus =
  (typeof AgeGroupStatus)[keyof typeof AgeGroupStatus];


  export interface ManualTranslationEdit {
    languageCode: string;
    name?: string;
    description?: string;
    title?: string;
    content?: string;
    question?: string;
    text?: string;
    hints?: string[];
  }
  