import { z } from "zod";

export const challengeTypeEnum = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SEQUENCING",
  "FILL_BLANK",
  "COMPLETE_WORD",
  "LETTER_DISCRIMINATION",
  "SOUND_MATCH",
  "READ_ALOUD",
  "WORD_BUILD",
]);

export type ChallengeTypeValue = z.infer<typeof challengeTypeEnum>;
