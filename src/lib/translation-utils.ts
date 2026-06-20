/**
 * Shared translation utilities for manual and auto-translate modes
 * Used across story creation/editing and age group management
 */

import {
  TranslationSourceType,
  ManualTranslationEdit,
  LanguageCode,
  Local,
} from "@/src/types/types";

/**
 * Get the source language code for a translation mode
 * @param source - The translation source mode
 * @returns Source language code (uppercase) or null for manual mode
 */
export function getSourceLanguageForMode(
  source: TranslationSourceType,
): LanguageCode | null {
  switch (source) {
    case TranslationSourceType.EN_TO_FR_AR:
      return LanguageCode.EN;
    case TranslationSourceType.FR_TO_AR_EN:
      return LanguageCode.FR;
    case TranslationSourceType.MANUAL:
      return null; // All languages in manual mode
    default:
      console.warn(`Unknown translation source: ${source}`);
      return null;
  }
}

/**
 * Build translations array based on translation source mode
 * For AUTO mode: builds single translation from main field value using source language
 * For MANUAL mode: returns all provided translations as-is
 *
 * @param translations - Provided manual translations
 * @param translationSource - The translation source mode
 * @param mainFieldValue - The main field value (string or object with title/description/content/question/text)
 * @returns Array of translations or undefined
 */
export function buildTranslations(
  translations: ManualTranslationEdit[] | undefined,
  translationSource: TranslationSourceType,
  mainFieldValue?:
    | string
    | {
        title?: string;
        description?: string;
        content?: string;
        question?: string;
        text?: string;
        hints?: string[];
      },
): ManualTranslationEdit[] | undefined {
  const sourceLanguage = getSourceLanguageForMode(translationSource);

  // For AUTO mode: build translation from main field value
  if (sourceLanguage && mainFieldValue) {
    if (typeof mainFieldValue === "string") {
      // For single text fields (question, answer text, simple name)
      return [{ languageCode: sourceLanguage, text: mainFieldValue }];
    } else {
      // For complex fields (title + description, title + content, question + hints)
      return [{ languageCode: sourceLanguage, ...mainFieldValue }];
    }
  }

  if (!translations || translations.length === 0) return undefined;

  // If in auto-translate mode but no main field provided, filter provided translations to source language
  if (sourceLanguage) {
    return translations.filter((t) => t.languageCode === sourceLanguage);
  }

  // In MANUAL mode, return all translations
  return translations;
}

export function getSourceLanguageLabel(source: TranslationSourceType): string {
  switch (source) {
    case TranslationSourceType.EN_TO_FR_AR:
      return "Auto-translate from English";
    case TranslationSourceType.FR_TO_AR_EN:
      return "Auto-translate from French";
    case TranslationSourceType.MANUAL:
      return "Manual translations";
    default:
      return "Unknown";
  }
}

export function getTargetLanguages(source: TranslationSourceType): string[] {
  switch (source) {
    case TranslationSourceType.EN_TO_FR_AR:
      return [LanguageCode.FR, LanguageCode.AR];
    case TranslationSourceType.FR_TO_AR_EN:
      return [LanguageCode.AR, LanguageCode.EN];
    case TranslationSourceType.MANUAL:
      return [LanguageCode.EN, LanguageCode.FR, LanguageCode.AR];
    default:
      return [];
  }
}

export const getLanguageCode = (locale : Local) => {
  const baseLocale = (locale || Local.EN).split("-")[0].toUpperCase();
  if (baseLocale === LanguageCode.EN) return LanguageCode.EN;
  if (baseLocale === LanguageCode.AR) return LanguageCode.AR;
  if (baseLocale === LanguageCode.FR) return LanguageCode.FR;
  return LanguageCode.EN;
};

export const ALL_LANGUAGES = [
  LanguageCode.EN,
  LanguageCode.FR,
  LanguageCode.AR,
] as const;
