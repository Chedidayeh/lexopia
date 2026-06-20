import type { StoryGenerationStatus } from "@prisma/client";

export type StoryContentRequestedEvent = {
  storyId: string;
  agentJobId: string;
  childId: string;
};

export type GenerateStoryContentResult =
  | { success: true; storyId: string; agentJobId: string }
  | { success: false; error: string };

export type NextStoryToGenerate = {
  storyId: string;
  episodeTitle: string;
  worldName: string;
  roadmapTitle: string;
  generationStatus: StoryGenerationStatus;
};
