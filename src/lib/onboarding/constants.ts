import type { ChallengeType, LanguageCode, ReadingLevel } from "@/src/types/types";

export const MIN_CHILD_AGE = 5;
export const MAX_CHILD_AGE = 14;


export const READING_LEVELS: { value: ReadingLevel; labelKey: string }[] = [
  { value: "BEGINNER", labelKey: "readingLevelBeginner" },
  { value: "EASY", labelKey: "readingLevelEasy" },
  { value: "MEDIUM", labelKey: "readingLevelMedium" },
  { value: "HARD", labelKey: "readingLevelHard" },
  { value: "ADVANCED", labelKey: "readingLevelAdvanced" },
];

export const LANGUAGE_OPTIONS: { value: LanguageCode; labelKey: string }[] = [
  { value: "EN", labelKey: "languageEnglish" },
  { value: "FR", labelKey: "languageFrench" },
  { value: "AR", labelKey: "languageArabic" },
];

export const INTEREST_OPTIONS = [
  "animals",
  "space",
  "fantasy",
  "superheroes",
  "nature",
  "friendship",
  "mystery",
  "ocean",
] as const;

export const CHARACTER_TYPES = [
  { value: "hero", labelKey: "characterHero" },
  { value: "explorer", labelKey: "characterExplorer" },
  { value: "inventor", labelKey: "characterInventor" },
  { value: "animal_friend", labelKey: "characterAnimalFriend" },
  { value: "team_player", labelKey: "characterTeamPlayer" },
] as const;

export const STORY_TONES = [
  { value: "funny", labelKey: "toneFunny" },
  { value: "adventurous", labelKey: "toneAdventurous" },
  { value: "calm", labelKey: "toneCalm" },
  { value: "magical", labelKey: "toneMagical" },
  { value: "educational", labelKey: "toneEducational" },
] as const;

export const CHALLENGE_TYPE_OPTIONS: {
  value: ChallengeType;
  labelKey: string;
  infoKey: string;
}[] = [
  { value: "MULTIPLE_CHOICE", labelKey: "challengeTypeMultipleChoice", infoKey: "multipleChoice" },
  { value: "TRUE_FALSE", labelKey: "challengeTypeTrueFalse", infoKey: "trueFalse" },
  { value: "SEQUENCING", labelKey: "challengeTypeSequencing", infoKey: "sequencing" },
  { value: "FILL_BLANK", labelKey: "challengeTypeFillBlank", infoKey: "fillBlank" },
  { value: "COMPLETE_WORD", labelKey: "challengeTypeCompleteWord", infoKey: "completeWord" },
  { value: "LETTER_DISCRIMINATION", labelKey: "challengeTypeLetterDiscrimination", infoKey: "letterDiscrimination" },
  { value: "SOUND_MATCH", labelKey: "challengeTypeSoundMatch", infoKey: "soundMatch" },
  { value: "READ_ALOUD", labelKey: "challengeTypeReadAloud", infoKey: "readAloud" },
  { value: "WORD_BUILD", labelKey: "challengeTypeWordBuild", infoKey: "wordBuild" },
];


export const SESSION_DURATIONS = [10, 20, 30, 60] as const;

export const STORIES_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
