import type { ChallengeType, LanguageCode } from "@prisma/client";
import type { ReadingPlan, Story } from "@prisma/client";

export type StoryTtsRequestedEvent = {
  storyId: string;
  agentJobId: string;
  childId: string;
};

export type EnqueueStoryTtsResult =
  | { success: true; storyId: string; agentJobId: string }
  | { success: false; error: string };

export type TtsChapterContext = {
  id: string;
  order: number;
  content: string;
  audioUrl: string;
  hasTtsAudio: boolean;
};

export type TtsAnswerContext = {
  id: string;
  order: number;
  text: string;
  audioUrl: string | null;
  hasTtsAudio: boolean;
};

export type TtsChallengeContext = {
  id: string;
  order: number;
  type: ChallengeType;
  question: string;
  audioUrl: string;
  targetWord: string | null;
  sentenceTemplate: string | null;
  hasQuestionTtsAudio: boolean;
  answers: TtsAnswerContext[];
};

export type TtsStoryContext = {
  story: Story;
  readingPlan: ReadingPlan;
  childId: string;
  readingPlanId: string;
  storyArcId: string | null;
  worldId: string;
  roadmapId: string;
  primaryLanguage: LanguageCode;
  chapters: TtsChapterContext[];
  challenges: TtsChallengeContext[];
};
