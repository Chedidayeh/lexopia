import type { Prisma } from "@prisma/client";
import {
  ContentStatus,
  ReadingPlanStatus,
  StoryGenerationStatus,
} from "@prisma/client";
import { deriveStorySizing } from "@/src/lib/onboarding/story-sizing";
import { prisma } from "@/src/lib/prisma";
import type { PlanningContext } from "./collect-planning-context";
import type { PlanBlueprint } from "./plan-blueprint.schema";

export type PersistPlanResult = {
  firstStoryId: string;
  totalStories: number;
};

export async function persistPlanScaffold(
  context: PlanningContext,
  blueprint: PlanBlueprint,
): Promise<PersistPlanResult> {
  const { readingPlan, child } = context;
  const sizing = deriveStorySizing(
    readingPlan.sessionDurationMins,
    readingPlan.readingLevel,
  );
  const languageCode = readingPlan.primaryLanguage;

  return prisma.$transaction(
    async (tx) => {
      let firstStoryId: string | null = null;
      let totalStories = 0;
      let isFirstRoadmap = true;

      const sortedRoadmaps = [...blueprint.roadmaps].sort((a, b) => {
        const aIdx = readingPlan.sourceInterests.indexOf(a.interest);
        const bIdx = readingPlan.sourceInterests.indexOf(b.interest);
        return aIdx - bIdx;
      });

      for (let roadmapIndex = 0; roadmapIndex < sortedRoadmaps.length; roadmapIndex++) {
        const roadmapBlueprint = sortedRoadmaps[roadmapIndex];

        const roadmap = await tx.roadmap.create({
          data: {
            childId: child.id,
            readingPlanId: readingPlan.id,
            interest: roadmapBlueprint.interest,
            displayName: roadmapBlueprint.title,
            order: roadmapIndex + 1,
            title: roadmapBlueprint.title,
            isActive: isFirstRoadmap,
            readingLevel: readingPlan.readingLevel,
            translations: {
              create: {
                languageCode,
                title: roadmapBlueprint.title,
              },
            },
          },
        });

        const sortedWorlds = [...roadmapBlueprint.worlds].sort(
          (a, b) => a.order - b.order,
        );

        for (let worldIndex = 0; worldIndex < sortedWorlds.length; worldIndex++) {
          const worldBlueprint = sortedWorlds[worldIndex];
          const isFirstWorld = isFirstRoadmap && worldIndex === 0;

          const world = await tx.world.create({
            data: {
              roadmapId: roadmap.id,
              name: worldBlueprint.name,
              description: worldBlueprint.description,
              theme: roadmapBlueprint.interest,
              interestTags: [roadmapBlueprint.interest],
              order: worldBlueprint.order,
              status: isFirstWorld ? ContentStatus.AVAILABLE : ContentStatus.LOCKED,
              storiesTarget: readingPlan.storiesPerWorld,
              translations: {
                create: {
                  languageCode,
                  name: worldBlueprint.name,
                  description: worldBlueprint.description,
                },
              },
            },
          });

          const storyArc = await tx.storyArc.create({
            data: {
              worldId: world.id,
              title: worldBlueprint.storyArc.title,
              synopsis: worldBlueprint.storyArc.synopsis,
              targetEpisodes: readingPlan.storiesPerWorld,
              continuityBible:
                worldBlueprint.storyArc.continuityBible as Prisma.InputJsonValue,
              generationStatus: StoryGenerationStatus.PENDING,
            },
          });

          const sortedEpisodes = [...worldBlueprint.storyArc.episodes].sort(
            (a, b) => a.episodeNumber - b.episodeNumber,
          );

          let previousStoryId: string | null = null;

          for (const episode of sortedEpisodes) {
            const isFirstEpisode = isFirstWorld && episode.episodeNumber === 1;

            const story: { id: string } = await tx.story.create({
              data: {
                worldId: world.id,
                storyArcId: storyArc.id,
                title: episode.episodeTitle,
                description: episode.episodeSummary,
                order: episode.episodeNumber,
                episodeNumber: episode.episodeNumber,
                episodeTitle: episode.episodeTitle,
                episodeBridge: episode.episodeSummary,
                previousStoryId,
                readingLevel: readingPlan.readingLevel,
                sessionDurationMins: readingPlan.sessionDurationMins,
                chaptersPerStory: sizing.chaptersPerStory,
                wordsPerChapter: sizing.wordsPerChapter,
                challengesPerStory: sizing.challengesPerStory,
                plannedChallengeTypes: episode.challengeTypes,
                personalization: {
                  childName: child.name,
                  interests: child.interests,
                  storyTone: child.storyTone,
                  favoriteCharacterType: child.favoriteCharacterType,
                  assignedChallenges: child.assignedChallenges,
                  interest: roadmapBlueprint.interest,
                  worldName: worldBlueprint.name,
                } as Prisma.InputJsonValue,
                generationStatus: StoryGenerationStatus.PENDING,
                translations: {
                  create: {
                    languageCode,
                    title: episode.episodeTitle,
                    description: episode.episodeSummary,
                  },
                },
              },
              select: { id: true },
            });

            previousStoryId = story.id;
            totalStories += 1;

            if (isFirstEpisode) {
              firstStoryId = story.id;
              await tx.childStoryProgress.create({
                data: {
                  childId: child.id,
                  storyId: story.id,
                  status: ContentStatus.AVAILABLE,
                },
              });
            } else {
              await tx.childStoryProgress.create({
                data: {
                  childId: child.id,
                  storyId: story.id,
                  status: ContentStatus.LOCKED,
                },
              });
            }
          }
        }

        isFirstRoadmap = false;
      }

      if (!firstStoryId) {
        throw new Error("Plan scaffold did not produce a first story");
      }

      await tx.readingPlan.update({
        where: { id: readingPlan.id },
        data: {
          status: ReadingPlanStatus.ACTIVE,
          isActive: true,
          activatedAt: new Date(),
          generationCompletedAt: new Date(),
          generationError: null,
        },
      });

      return { firstStoryId, totalStories };
    },
    { maxWait: 15_000, timeout: 120_000 },
  );
}
