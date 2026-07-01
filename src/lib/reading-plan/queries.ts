import {
  ReadingPlanStatus,
  StoryGenerationStatus,
} from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { findNextStoryToGenerate } from "@/src/lib/story-content/find-next-story";
import { getStoryIdsWithGeneratingTts } from "@/src/lib/tts/plan-tts-status";
import { canGenerateStoryThisWeek } from "@/src/lib/story-content/weekly-story-limit";
import type {
  ReadingPlanDetailView,
  ReadingPlanStatusView,
} from "./types";

export type ReadingPlanSummary = {
  id: string;
  planNumber: number;
  status: ReadingPlanStatus;
  isActive: boolean;
  sourceInterests: string[];
  readyStories: number;
  totalStories: number;
  createdAt: Date;
  activatedAt: Date | null;
};

/**
 * Fetch all reading plans for a child with summary information
 */
export async function getChildReadingPlans(
  childId: string,
): Promise<ReadingPlanSummary[]> {
  const plans = await prisma.readingPlan.findMany({
    where: {
      childId,
      status: {
        notIn: [ReadingPlanStatus.FAILED],
      },
    },
    orderBy: { planNumber: "desc" },
    select: {
      id: true,
      planNumber: true,
      status: true,
      isActive: true,
      sourceInterests: true,
      createdAt: true,
      activatedAt: true,
      roadmaps: {
        select: {
          worlds: {
            select: {
              stories: {
                select: {
                  generationStatus: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return plans.map((plan) => {
    const allStories = plan.roadmaps.flatMap((roadmap) =>
      roadmap.worlds.flatMap((world) => world.stories),
    );
    const totalStories = allStories.length;
    const readyStories = allStories.filter(
      (story) => story.generationStatus === StoryGenerationStatus.READY,
    ).length;

    return {
      id: plan.id,
      planNumber: plan.planNumber,
      status: plan.status,
      isActive: plan.isActive,
      sourceInterests: plan.sourceInterests,
      readyStories,
      totalStories,
      createdAt: plan.createdAt,
      activatedAt: plan.activatedAt,
    };
  });
}

/**
 * Fetch a specific reading plan by ID with full details
 */
export async function getChildReadingPlanById(
  planId: string,
  childId: string,
): Promise<ReadingPlanDetailView | null> {
  const plan = await prisma.readingPlan.findFirst({
    where: { id: planId, childId },
    include: {
      roadmaps: {
        orderBy: { order: "asc" },
        include: {
          worlds: {
            orderBy: { order: "asc" },
            include: {
              storyArc: true,
              stories: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  order: true,
                  episodeNumber: true,
                  title: true,
                  episodeTitle: true,
                  generationStatus: true,
                  plannedChallengeTypes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) return null;

  const weeklyLimit = await canGenerateStoryThisWeek(childId, plan.storiesPerWeek);

  const progressByStoryId = new Map(
    (
      await prisma.childStoryProgress.findMany({
        where: {
          childId,
          storyId: {
            in: plan.roadmaps.flatMap((roadmap) =>
              roadmap.worlds.flatMap((world) =>
                world.stories.map((story) => story.id),
              ),
            ),
          },
        },
        select: { storyId: true, status: true },
      })
    ).map((entry) => [entry.storyId, entry.status]),
  );

  const counts = countStoryStatuses(plan);

  const allStoryIds = plan.roadmaps.flatMap((roadmap) =>
    roadmap.worlds.flatMap((world) => world.stories.map((story) => story.id)),
  );
  const ttsGeneratingStoryIds = await getStoryIdsWithGeneratingTts(allStoryIds);

  const detail: ReadingPlanDetailView = {
    planId: plan.id,
    status: plan.status,
    isActive: plan.isActive,
    planNumber: plan.planNumber,
    generationError: plan.generationError,
    readyStories: counts.readyStories,
    totalStories: counts.totalStories,
    startedAt: plan.generationStartedAt,
    activatedAt: plan.activatedAt,
    sourceInterests: plan.sourceInterests,
    readingLevel: plan.readingLevel,
    storiesPerWeek: plan.storiesPerWeek,
    sessionDurationMins: plan.sessionDurationMins,
    storyTone: plan.storyTone,
    roadmaps: plan.roadmaps
      .sort((a, b) => a.order - b.order)
      .map((roadmap) => ({
        id: roadmap.id,
        interest: roadmap.interest,
        title: roadmap.title,
        order: roadmap.order,
        isActive: roadmap.isActive,
        worlds: roadmap.worlds
          .sort((a, b) => a.order - b.order)
          .map((world) => ({
            id: world.id,
            name: world.name,
            description: world.description,
            order: world.order,
            status: world.status,
            storyArc: world.storyArc
              ? {
                  title: world.storyArc.title,
                  synopsis: world.storyArc.synopsis,
                  targetEpisodes: world.storyArc.targetEpisodes,
                  generationStatus: world.storyArc.generationStatus,
                }
              : null,
            stories: world.stories
              .sort((a, b) => a.order - b.order)
              .map((story) => ({
                id: story.id,
                order: story.order,
                episodeNumber: story.episodeNumber,
                title: story.title,
                episodeTitle: story.episodeTitle,
                generationStatus: story.generationStatus,
                progressStatus: progressByStoryId.get(story.id) ?? null,
                plannedChallengeTypes: story.plannedChallengeTypes,
                isTtsGenerating: ttsGeneratingStoryIds.has(story.id),
              })),
          })),
      })),
    nextStoryToGenerate: null,
    weeklyStoryLimit: {
      generatedThisWeek: weeklyLimit.generatedCount,
      remaining: weeklyLimit.remaining,
      canGenerate: weeklyLimit.canGenerate,
    },
  };

  detail.nextStoryToGenerate = findNextStoryToGenerate(detail);

  return detail;
}

export async function getActiveReadingPlanStatus(
  childId: string,
): Promise<ReadingPlanStatusView | null> {
  const plan = await findLatestReadingPlan(childId);
  if (!plan) return null;

  const counts = countStoryStatuses(plan);

  return {
    planId: plan.id,
    status: plan.status,
    isActive: plan.isActive,
    planNumber: plan.planNumber,
    generationError: plan.generationError,
    readyStories: counts.readyStories,
    totalStories: counts.totalStories,
    startedAt: plan.generationStartedAt,
    activatedAt: plan.activatedAt,
  };
}

export async function getChildReadingPlanDetail(
  childId: string,
): Promise<ReadingPlanDetailView | null> {
  const plan = await findLatestReadingPlan(childId);
  if (!plan) return null;

  const weeklyLimit = await canGenerateStoryThisWeek(childId, plan.storiesPerWeek);

  const progressByStoryId = new Map(
    (
      await prisma.childStoryProgress.findMany({
        where: {
          childId,
          storyId: {
            in: plan.roadmaps.flatMap((roadmap) =>
              roadmap.worlds.flatMap((world) =>
                world.stories.map((story) => story.id),
              ),
            ),
          },
        },
        select: { storyId: true, status: true },
      })
    ).map((entry) => [entry.storyId, entry.status]),
  );

  const counts = countStoryStatuses(plan);

  const allStoryIds = plan.roadmaps.flatMap((roadmap) =>
    roadmap.worlds.flatMap((world) => world.stories.map((story) => story.id)),
  );
  const ttsGeneratingStoryIds = await getStoryIdsWithGeneratingTts(allStoryIds);

  const detail: ReadingPlanDetailView = {
    planId: plan.id,
    status: plan.status,
    isActive: plan.isActive,
    planNumber: plan.planNumber,
    generationError: plan.generationError,
    readyStories: counts.readyStories,
    totalStories: counts.totalStories,
    startedAt: plan.generationStartedAt,
    activatedAt: plan.activatedAt,
    sourceInterests: plan.sourceInterests,
    readingLevel: plan.readingLevel,
    storiesPerWeek: plan.storiesPerWeek,
    sessionDurationMins: plan.sessionDurationMins,
    storyTone: plan.storyTone,
    roadmaps: plan.roadmaps
      .sort((a, b) => a.order - b.order)
      .map((roadmap) => ({
        id: roadmap.id,
        interest: roadmap.interest,
        title: roadmap.title,
        order: roadmap.order,
        isActive: roadmap.isActive,
        worlds: roadmap.worlds
          .sort((a, b) => a.order - b.order)
          .map((world) => ({
            id: world.id,
            name: world.name,
            description: world.description,
            order: world.order,
            status: world.status,
            storyArc: world.storyArc
              ? {
                  title: world.storyArc.title,
                  synopsis: world.storyArc.synopsis,
                  targetEpisodes: world.storyArc.targetEpisodes,
                  generationStatus: world.storyArc.generationStatus,
                }
              : null,
            stories: world.stories
              .sort((a, b) => a.order - b.order)
              .map((story) => ({
                id: story.id,
                order: story.order,
                episodeNumber: story.episodeNumber,
                title: story.title,
                episodeTitle: story.episodeTitle,
                generationStatus: story.generationStatus,
                progressStatus: progressByStoryId.get(story.id) ?? null,
                plannedChallengeTypes: story.plannedChallengeTypes,
                isTtsGenerating: ttsGeneratingStoryIds.has(story.id),
              })),
          })),
      })),
    nextStoryToGenerate: null,
    weeklyStoryLimit: {
      generatedThisWeek: weeklyLimit.generatedCount,
      remaining: weeklyLimit.remaining,
      canGenerate: weeklyLimit.canGenerate,
    },
  };

  detail.nextStoryToGenerate = findNextStoryToGenerate(detail);

  return detail;
}

async function findLatestReadingPlan(childId: string) {
  return prisma.readingPlan.findFirst({
    where: {
      childId,
      status: {
        in: [
          ReadingPlanStatus.GENERATING,
          ReadingPlanStatus.ACTIVE,
          ReadingPlanStatus.PAUSED,
          ReadingPlanStatus.DRAFT,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      roadmaps: {
        orderBy: { order: "asc" },
        include: {
          worlds: {
            orderBy: { order: "asc" },
            include: {
              storyArc: true,
              stories: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  order: true,
                  episodeNumber: true,
                  title: true,
                  episodeTitle: true,
                  generationStatus: true,
                  plannedChallengeTypes: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

function countStoryStatuses(
  plan: NonNullable<Awaited<ReturnType<typeof findLatestReadingPlan>>>,
) {
  const allStories = plan.roadmaps.flatMap((roadmap) =>
    roadmap.worlds.flatMap((world) => world.stories),
  );

  return {
    totalStories: allStories.length,
    readyStories: allStories.filter(
      (story) => story.generationStatus === StoryGenerationStatus.READY,
    ).length,
  };
}
