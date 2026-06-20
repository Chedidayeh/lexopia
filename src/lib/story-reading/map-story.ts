import type { Prisma } from "@prisma/client";
import type { Challenge, Story } from "@/src/lib/dashboard/types";

export const storyReadingInclude = {
  translations: true,
  chapters: {
    orderBy: { order: "asc" as const },
    include: { translations: true },
  },
  challenges: {
    orderBy: { order: "asc" as const },
    include: {
      translations: true,
      answers: {
        orderBy: { order: "asc" as const },
        include: { translations: true },
      },
      hints: {
        orderBy: { order: "asc" as const },
        include: { translations: true },
      },
    },
  },
  world: {
    include: {
      roadmap: {
        include: {
          child: {
            select: { id: true, parentId: true },
          },
        },
      },
    },
  },
} satisfies Prisma.StoryInclude;

export type StoryWithReadingRelations = Prisma.StoryGetPayload<{
  include: typeof storyReadingInclude;
}>;

function mapHintTexts(
  hints: StoryWithReadingRelations["challenges"][number]["hints"],
  languageCode: string,
): string[] {
  return hints
    .map((hint) => {
      const translation = hint.translations.find(
        (entry) => entry.languageCode === languageCode,
      );
      return translation?.text || hint.text || "";
    })
    .filter(Boolean);
}

function mapChallenge(
  challenge: StoryWithReadingRelations["challenges"][number],
): Challenge {
  return {
    id: challenge.id,
    type: challenge.type,
    storyId: challenge.storyId,
    question: challenge.question,
    audioUrl: challenge.audioUrl,
    imageUrl: null,
    baseStars: challenge.baseStars,
    targetWord: challenge.targetWord,
    correctAnswerBoolean: challenge.correctAnswerBoolean,
    sentenceTemplate: challenge.sentenceTemplate,
    blankIndex: challenge.blankIndex,
    correctAnswerJson: challenge.correctAnswerJson,
    translations: challenge.translations.map((translation) => ({
      languageCode: translation.languageCode,
      question: translation.question,
      audioUrl: translation.audioUrl,
      sentenceTemplate: translation.sentenceTemplate,
      hints: mapHintTexts(challenge.hints, translation.languageCode),
    })),
    answers: challenge.answers.map((answer) => ({
      id: answer.id,
      text: answer.text,
      order: answer.order,
      isCorrect: answer.isCorrect,
      correctSequence: answer.correctSequence,
      audioUrl: answer.audioUrl,
      letterValue: answer.letterValue,
      translations: answer.translations.map((translation) => ({
        languageCode: translation.languageCode,
        text: translation.text,
      })),
    })),
    hints: challenge.hints.map((hint) => ({
      id: hint.id,
      level: hint.level,
      order: hint.order,
      text: hint.text,
      translations: hint.translations.map((translation) => ({
        languageCode: translation.languageCode,
        text: translation.text,
      })),
    })),
  };
}

export function toReadingStory(story: StoryWithReadingRelations): Story {
  const challengesByChapter = new Map<string, Challenge>();
  for (const challenge of story.challenges) {
    if (challenge.placementChapterId) {
      challengesByChapter.set(
        challenge.placementChapterId,
        mapChallenge(challenge),
      );
    }
  }

  return {
    id: story.id,
    title: story.title,
    sessionDurationMins: story.sessionDurationMins,
    translations: story.translations.map((translation) => ({
      languageCode: translation.languageCode,
      title: translation.title,
      description: translation.description,
    })),
    chapters: story.chapters.map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      content: chapter.content,
      audioUrl: chapter.audioUrl,
      imageUrl: null,
      translations: chapter.translations.map((translation) => ({
        languageCode: translation.languageCode,
        content: translation.content,
        audioUrl: translation.audioUrl,
      })),
      challenge: challengesByChapter.get(chapter.id) ?? null,
    })),
    challenges: story.challenges.map(mapChallenge),
  };
}

export function getStoryParentId(
  story: StoryWithReadingRelations,
): string | null {
  return story.world?.roadmap?.child?.parentId ?? null;
}

export function getStoryChildId(story: StoryWithReadingRelations): string | null {
  return story.world?.roadmap?.child?.id ?? null;
}
