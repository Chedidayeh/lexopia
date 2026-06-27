import type {
  ContentStatus,
  ReadingLevel,
  ReadingPlanStatus,
  StoryGenerationStatus,
} from "@prisma/client";
import type { NextStoryToGenerate } from "@/src/lib/story-content/types";

export type GeneratePlanResult =
  | { success: true; readingPlanId: string; agentJobId: string }
  | { success: false; error: string };

export type ReadingPlanStatusView = {
  planId: string;
  status: ReadingPlanStatus;
  isActive: boolean;
  planNumber: number;
  generationError: string | null;
  readyStories: number;
  totalStories: number;
  startedAt: Date | null;
  activatedAt: Date | null;
};

export type ReadingPlanEpisodeView = {
  id: string;
  order: number;
  episodeNumber: number | null;
  title: string;
  episodeTitle: string | null;
  generationStatus: StoryGenerationStatus;
  progressStatus: ContentStatus | null;
  plannedChallengeTypes: string[];
  isTtsGenerating: boolean;
};

export type ReadingPlanWorldView = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: ContentStatus;
  storyArc: {
    title: string;
    synopsis: string | null;
    targetEpisodes: number;
    generationStatus: StoryGenerationStatus;
  } | null;
  stories: ReadingPlanEpisodeView[];
};

export type ReadingPlanRoadmapView = {
  id: string;
  interest: string;
  title: string | null;
  order: number;
  isActive: boolean;
  worlds: ReadingPlanWorldView[];
};

export type ReadingPlanDetailView = ReadingPlanStatusView & {
  sourceInterests: string[];
  readingLevel: ReadingLevel;
  storiesPerWeek: number;
  sessionDurationMins: number;
  storyTone: string | null;
  roadmaps: ReadingPlanRoadmapView[];
  nextStoryToGenerate: NextStoryToGenerate | null;
  weeklyStoryLimit: {
    generatedThisWeek: number;
    remaining: number;
    canGenerate: boolean;
  };
};

export type ReadingPlanTabState = {
  plan: ReadingPlanDetailView | null;
  canManuallyGenerateInitialPlan: boolean;
};

export type PlanningRequestedEvent = {
  readingPlanId: string;
  agentJobId: string;
  childId: string;
};
