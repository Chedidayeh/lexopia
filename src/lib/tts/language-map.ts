import type { LanguageCode } from "@prisma/client";
import { TTSLanguageCodes } from "@/src/types/types";

export function toTtsLanguageCode(language: LanguageCode): TTSLanguageCodes {
  switch (language) {
    case "AR":
      return TTSLanguageCodes.ARABIC;
    case "FR":
      return TTSLanguageCodes.FRENCH;
    default:
      return TTSLanguageCodes.ENGLISH_US;
  }
}

export const TTS_VOICE_NAME = "Achernar";
