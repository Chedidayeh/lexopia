import type {
  Child,
  ReadingPlan,
  Roadmap,
  Story,
  StoryArc,
  World,
} from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  deriveStorySizing,
  type StorySizing,
} from "@/src/lib/onboarding/story-sizing";
import type { ReadingPlanConfiguration } from "@/src/lib/onboarding/plan-constraints";
import { getReadingPlanConfigurationFromChild } from "@/src/lib/onboarding/plan-constraints";
import { resolvePlannedChallengeTypes } from "./story-content.schema";
import {
  buildPriorEpisodeRecapEntry,
  type PriorEpisodeRecapEntry,
  resolveEpisodeEnding,
  type CharacterContinuityEntry,
  type PlotThreadContinuityEntry,
  type WorldElementContinuityEntry,
  formatCharacterContinuity,
  formatPlotThreadContinuity,
  formatWorldElementContinuity,
} from "./episode-continuity";

export type StoryPersonalization = {
  childName?: string;
  interests?: string[];
  storyTone?: string | null;
  favoriteCharacterType?: string | null;
  assignedChallenges?: string[];
  interest?: string;
  worldName?: string;
};

export type StoryContentContext = {
  story: Story;
  storyArc: StoryArc;
  world: World;
  roadmap: Roadmap;
  child: Child;
  readingPlan: ReadingPlan;
  readingPlanConfiguration: ReadingPlanConfiguration;
  assignedChallenges: string[];
  plannedChallengeTypes: string[];
  personalization: StoryPersonalization;
  previousEpisodeBridge: string | null;
  priorEpisodesRecap: PriorEpisodeRecapEntry[];
  characterContinuity: CharacterContinuityEntry[];
  plotThreadContinuity: PlotThreadContinuityEntry[];
  worldElementContinuity: WorldElementContinuityEntry[];
  sizing: StorySizing;
};

function readStoryPlannedChallengeTypes(story: Story): string[] {
  const record = story as Story & { plannedChallengeTypes?: string[] };
  return record.plannedChallengeTypes ?? [];
}

export async function collectStoryContext(
  storyId: string,
): Promise<StoryContentContext | null> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      storyArc: true,
      world: {
        include: {
          roadmap: {
            include: {
              child: true,
              readingPlan: true,
            },
          },
        },
      },
    },
  });

  if (
    !story?.storyArc ||
    !story.world?.roadmap?.child ||
    !story.world.roadmap.readingPlan
  ) {
    return null;
  }

  const personalization = (story.personalization ?? {}) as StoryPersonalization;
  const assignedChallenges =
    personalization.assignedChallenges?.length
      ? personalization.assignedChallenges
      : story.world.roadmap.child.assignedChallenges ?? [];

  const currentEpisodeNumber = story.episodeNumber ?? story.order;

  const priorStories = story.storyArcId
    ? await prisma.story.findMany({
        where: {
          storyArcId: story.storyArcId,
          episodeNumber: { lt: currentEpisodeNumber },
        },
        orderBy: { episodeNumber: "asc" },
        select: {
          episodeNumber: true,
          order: true,
          episodeTitle: true,
          title: true,
          description: true,
          episodeBridge: true,
          chapters: {
            orderBy: { order: "desc" },
            take: 1,
            select: { content: true },
          },
        },
      })
    : [];

  const priorEpisodesRecap = priorStories.map((prior) =>
    buildPriorEpisodeRecapEntry({
      episodeNumber: prior.episodeNumber ?? prior.order,
      episodeTitle: prior.episodeTitle ?? prior.title,
      description: prior.description,
      episodeBridge: prior.episodeBridge,
      lastChapterContent: prior.chapters[0]?.content,
    }),
  );

  const lastPriorStory = priorStories.at(-1);
  const previousEpisodeBridge = lastPriorStory
    ? resolveEpisodeEnding({
        episodeBridge: lastPriorStory.episodeBridge,
        lastChapterContent: lastPriorStory.chapters[0]?.content,
      })
    : null;

  // Extract continuity data from the story arc's continuity bible
  const continuityBible = story.storyArc.continuityBible as Record<string, any> || {};
  const characterContinuity: CharacterContinuityEntry[] = continuityBible.characters || [];
  const plotThreadContinuity: PlotThreadContinuityEntry[] = continuityBible.plotThreads || [];
  const worldElementContinuity: WorldElementContinuityEntry[] = continuityBible.worldElements || [];

  const readingPlanConfiguration = getReadingPlanConfigurationFromChild(
    story.world.roadmap.child,
  );
  const sizing = deriveStorySizing(
    story.sessionDurationMins,
    story.readingLevel,
    readingPlanConfiguration,
  );

  const plannedChallengeTypes = resolvePlannedChallengeTypes(
    {
      plannedChallengeTypes: readStoryPlannedChallengeTypes(story),
      challengesPerStory: story.challengesPerStory,
    },
    assignedChallenges,
  ) ?? [];

  return {
    story,
    storyArc: story.storyArc,
    world: story.world,
    roadmap: story.world.roadmap,
    child: story.world.roadmap.child,
    readingPlan: story.world.roadmap.readingPlan,
    readingPlanConfiguration,
    assignedChallenges: assignedChallenges ?? [],
    plannedChallengeTypes,
    personalization,
    previousEpisodeBridge,
    priorEpisodesRecap: priorEpisodesRecap ?? [],
    characterContinuity: characterContinuity ?? [],
    plotThreadContinuity: plotThreadContinuity ?? [],
    worldElementContinuity: worldElementContinuity ?? [],
    sizing,
  };
}

export function buildStoryContentInputSnapshot(context: StoryContentContext) {
  const {
    story,
    storyArc,
    world,
    roadmap,
    child,
    readingPlan,
    readingPlanConfiguration,
    assignedChallenges,
    plannedChallengeTypes,
    characterContinuity,
    plotThreadContinuity,
    worldElementContinuity,
  } = context;

  return {
    story: {
      id: story.id,
      title: story.title,
      episodeNumber: story.episodeNumber,
      episodeTitle: story.episodeTitle,
      episodeBridge: story.episodeBridge,
      chaptersPerStory: story.chaptersPerStory,
      wordsPerChapter: story.wordsPerChapter,
      challengesPerStory: story.challengesPerStory,
      plannedChallengeTypes: story.plannedChallengeTypes ?? [],
      readingLevel: story.readingLevel,
      sessionDurationMins: story.sessionDurationMins,
    },
    storyArc: {
      id: storyArc.id,
      title: storyArc.title,
      synopsis: storyArc.synopsis,
      targetEpisodes: storyArc.targetEpisodes,
      continuityBible: storyArc.continuityBible,
    },
    world: { id: world.id, name: world.name, description: world.description },
    roadmap: { id: roadmap.id, interest: roadmap.interest, title: roadmap.title },
    child: {
      id: child.id,
      name: child.name,
      age: child.age,
      readingLevel: child.readingLevel,
      primaryLanguage: child.primaryLanguage,
    },
    readingPlan: {
      id: readingPlan.id,
      primaryLanguage: readingPlan.primaryLanguage,
      storyTone: readingPlan.storyTone,
      readingPlanConfiguration,
    },
    assignedChallenges: assignedChallenges ?? [],
    plannedChallengeTypes: plannedChallengeTypes ?? [],
    previousEpisodeBridge: context.previousEpisodeBridge,
    priorEpisodesRecap: context.priorEpisodesRecap ?? [],
    characterContinuity: characterContinuity ?? [],
    plotThreadContinuity: plotThreadContinuity ?? [],
    worldElementContinuity: worldElementContinuity ?? [],
  };
}
