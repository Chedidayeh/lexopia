import "server-only";

import type { Chapter } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { isAnswerTtsPrompt } from "./challenge-tts-helpers";
import type { TtsStoryContext } from "./types";

export type {
  TtsAnswerContext,
  TtsChallengeContext,
  TtsChapterContext,
  TtsStoryContext,
} from "./types";

export async function collectTtsContext(
  storyId: string,
): Promise<TtsStoryContext | null> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      chapters: {
        orderBy: { order: "asc" },
      },
      challenges: {
        orderBy: { order: "asc" },
        include: {
          answers: {
            orderBy: { order: "asc" },
          },
        },
      },
      world: {
        include: {
          roadmap: {
            include: {
              readingPlan: true,
              child: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (
    !story?.world?.roadmap?.readingPlan ||
    !story.world.roadmap.child
  ) {
    return null;
  }

  const chapterIds = story.chapters.map((chapter) => chapter.id);
  const challengeIds = story.challenges.map((challenge) => challenge.id);

  const [chapterTtsRows, challengeTtsRows] = await Promise.all([
    chapterIds.length
      ? prisma.tTSAudio.findMany({
          where: {
            storyId,
            chapterId: { in: chapterIds },
          },
          select: { chapterId: true },
        })
      : Promise.resolve([]),
    challengeIds.length
      ? prisma.tTSAudio.findMany({
          where: {
            storyId,
            challengeId: { in: challengeIds },
          },
          select: { challengeId: true, prompt: true },
        })
      : Promise.resolve([]),
  ]);

  const ttsChapterIds = new Set(
    chapterTtsRows
      .map((entry) => entry.chapterId)
      .filter((id): id is string => Boolean(id)),
  );

  const questionTtsChallengeIds = new Set<string>();
  const answerTtsByAnswerId = new Set<string>();

  for (const row of challengeTtsRows) {
    if (!row.challengeId) {
      continue;
    }

    if (isAnswerTtsPrompt(row.prompt)) {
      const answerId = row.prompt!.slice("answer:".length);
      if (answerId) {
        answerTtsByAnswerId.add(answerId);
      }
      continue;
    }

    questionTtsChallengeIds.add(row.challengeId);
  }

  return {
    story,
    readingPlan: story.world.roadmap.readingPlan,
    childId: story.world.roadmap.child.id,
    readingPlanId: story.world.roadmap.readingPlan.id,
    storyArcId: story.storyArcId,
    worldId: story.worldId,
    roadmapId: story.world.roadmap.id,
    primaryLanguage: story.world.roadmap.readingPlan.primaryLanguage,
    chapters: story.chapters.map((chapter: Chapter) => ({
      id: chapter.id,
      order: chapter.order,
      content: chapter.content,
      audioUrl: chapter.audioUrl,
      hasTtsAudio: ttsChapterIds.has(chapter.id),
    })),
    challenges: story.challenges.map((challenge) => ({
      id: challenge.id,
      order: challenge.order,
      type: challenge.type,
      question: challenge.question,
      audioUrl: challenge.audioUrl,
      targetWord: challenge.targetWord,
      sentenceTemplate: challenge.sentenceTemplate,
      hasQuestionTtsAudio: questionTtsChallengeIds.has(challenge.id),
      answers: challenge.answers.map((answer) => ({
        id: answer.id,
        order: answer.order ?? 0,
        text: answer.text,
        audioUrl: answer.audioUrl,
        hasTtsAudio: answerTtsByAnswerId.has(answer.id),
      })),
    })),
  };
}

export function buildTtsInputSnapshot(context: TtsStoryContext) {
  const challengeTargetCount = context.challenges.reduce((count, challenge) => {
    const answerCount =
      challenge.type === "SOUND_MATCH" ? challenge.answers.length : 0;
    return count + 1 + answerCount;
  }, 0);

  return {
    storyId: context.story.id,
    childId: context.childId,
    primaryLanguage: context.primaryLanguage,
    chapterCount: context.chapters.length,
    challengeCount: context.challenges.length,
    challengeTargetCount,
    chapters: context.chapters.map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      hasAudio: Boolean(chapter.audioUrl?.trim()),
      hasTtsAudio: chapter.hasTtsAudio,
    })),
    challenges: context.challenges.map((challenge) => ({
      id: challenge.id,
      order: challenge.order,
      type: challenge.type,
      hasAudio: Boolean(challenge.audioUrl?.trim()),
      hasQuestionTtsAudio: challenge.hasQuestionTtsAudio,
      answerCount: challenge.answers.length,
    })),
  };
}
