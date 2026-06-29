import {
  HintLevel,
  StoryGenerationStatus,
  type LanguageCode,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import type { StoryContentContext } from "./collect-story-context";
import type {
  ChallengeBlueprint,
  StoryChallengesBlueprint,
  StoryChaptersBlueprint,
} from "./story-content.schema";
import { extractEpisodeCliffhanger } from "./episode-continuity";

const NO_AUDIO = "";

export type PersistStoryContentResult = {
  chapterIds: string[];
  challengeIds: string[];
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function persistStoryContent(
  context: StoryContentContext,
  chaptersBlueprint: StoryChaptersBlueprint,
  challengesBlueprint: StoryChallengesBlueprint,
  chaptersPrompt: string,
  challengesPrompt: string,
): Promise<PersistStoryContentResult> {
  const { story, readingPlan, sizing } = context;
  const languageCode = readingPlan.primaryLanguage as LanguageCode;

  return prisma.$transaction(
    async (tx) => {
      await tx.challenge.deleteMany({ where: { storyId: story.id } });
      await tx.chapter.deleteMany({ where: { storyId: story.id } });

      const chapterIdByOrder = new Map<number, string>();
      const chapterIds: string[] = [];

      const sortedChapters = [...chaptersBlueprint.chapters].sort(
        (a, b) => a.order - b.order,
      );
      const lastChapter = sortedChapters.at(-1);
      const episodeBridge = lastChapter
        ? extractEpisodeCliffhanger(lastChapter.content)
        : null;

      for (const chapter of sortedChapters) {
        const created = await tx.chapter.create({
          data: {
            storyId: story.id,
            order: chapter.order,
            content: chapter.content,
            audioUrl: NO_AUDIO,
            wordCount: countWords(chapter.content),
            targetWordMin: sizing.targetWordMin,
            targetWordMax: sizing.targetWordMax,
            translations: {
              create: {
                languageCode,
                content: chapter.content,
                audioUrl: NO_AUDIO,
              },
            },
          },
          select: { id: true },
        });

        chapterIdByOrder.set(chapter.order, created.id);
        chapterIds.push(created.id);
      }

      const challengeIds: string[] = [];

      for (const challenge of challengesBlueprint.challenges.sort(
        (a, b) => a.order - b.order,
      )) {
        const placementChapterId = chapterIdByOrder.get(
          challenge.placementChapterOrder,
        );
        if (!placementChapterId) {
          throw new Error(
            `Missing chapter for placementChapterOrder ${challenge.placementChapterOrder}`,
          );
        }

        const created = await tx.challenge.create({
          data: buildChallengeCreateData(
            challenge,
            story.id,
            placementChapterId,
            languageCode,
          ),
          select: { id: true },
        });

        challengeIds.push(created.id);
      }

      await tx.story.update({
        where: { id: story.id },
        data: {
          generationStatus: StoryGenerationStatus.GENERATING,
          episodeBridge,
          aiPromptSnapshot: `${chaptersPrompt}\n\n---\n\n${challengesPrompt}`,
        },
      });

      return { chapterIds, challengeIds };
    },
    { maxWait: 15_000, timeout: 120_000 },
  );
}

function buildChallengeCreateData(
  challenge: ChallengeBlueprint,
  storyId: string,
  placementChapterId: string,
  languageCode: LanguageCode,
): Prisma.ChallengeUncheckedCreateInput {
  return {
    storyId,
    type: challenge.type,
    question: challenge.question,
    audioUrl: NO_AUDIO,
    order: challenge.order,
    targetWord: challenge.targetWord,
    correctAnswerBoolean: challenge.correctAnswerBoolean,
    sentenceTemplate: challenge.sentenceTemplate,
    blankIndex: challenge.blankIndex,
    placementChapterId,
    requiresStoryComplete: true,
    translations: {
      create: {
        languageCode,
        question: challenge.question,
        audioUrl: NO_AUDIO,
        sentenceTemplate: challenge.sentenceTemplate,
      },
    },
    answers: challenge.answers
      ? {
          create: challenge.answers.map((answer) => ({
            text: answer.text,
            isCorrect: answer.isCorrect ?? false,
            order: answer.order,
            correctSequence: answer.correctSequence,
            letterValue: answer.letterValue,
            translations: {
              create: {
                languageCode,
                text: answer.text,
              },
            },
          })),
        }
      : undefined,
    hints: challenge.hints?.length
      ? {
          create: challenge.hints.map((hint, index) => ({
            level: HintLevel.TEXT,
            order: index + 1,
            text: hint,
            translations: {
              create: {
                languageCode,
                text: hint,
              },
            },
          })),
        }
      : undefined,
  };
}
