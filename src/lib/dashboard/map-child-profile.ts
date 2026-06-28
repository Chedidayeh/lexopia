import type { Prisma } from "@prisma/client";
import { INTEREST_OPTIONS } from "@/src/lib/onboarding/constants";
import { ContentStatus, ProgressStatus } from "@/src/types/types";
import type { ChildProfile, Challenge, Progress, Story } from "./types";

const childProfileInclude = {
  dailyActivity: true,
  badges: true,
  roadmaps: {
    where: { isActive: true },
    include: {
      worlds: {
        include: {
          stories: { select: { id: true } },
        },
      },
    },
  },
  storyProgress: {
    include: {
      story: {
        include: {
          translations: true,
          chapters: {
            orderBy: { order: "asc" as const },
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
        },
      },
      gameSessions: {
        include: {
          checkpoints: true,
          readingMetrics: true,
          challengeAttempts: {
            include: {
              challenge: true,
              actions: { orderBy: { createdAt: "asc" as const } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ChildInclude;

export type ChildWithDashboardRelations = Prisma.ChildGetPayload<{
  include: typeof childProfileInclude;
}>;

function mapContentStatusToProgressStatus(status: string): string {
  switch (status) {
    case ContentStatus.COMPLETED:
      return ProgressStatus.COMPLETED;
    case ContentStatus.IN_PROGRESS:
      return ProgressStatus.IN_PROGRESS;
    default:
      return ProgressStatus.NOT_STARTED;
  }
}

function mapChallenge(
  challenge: ChildWithDashboardRelations["storyProgress"][number]["story"]["challenges"][number],
): Challenge {
  return {
    id: challenge.id,
    type: challenge.type,
    storyId: challenge.storyId,
    question: challenge.question,
    targetWord: challenge.targetWord,
    correctAnswerBoolean: challenge.correctAnswerBoolean,
    sentenceTemplate: challenge.sentenceTemplate,
    translations: challenge.translations.map((translation) => ({
      languageCode: translation.languageCode,
      question: translation.question,
      sentenceTemplate: translation.sentenceTemplate,
    })),
    answers: challenge.answers.map((answer) => ({
      id: answer.id,
      text: answer.text,
      order: answer.order,
      isCorrect: answer.isCorrect,
      correctSequence: answer.correctSequence,
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

function mapStoryProgressToProgress(
  storyProgress: ChildWithDashboardRelations["storyProgress"][number],
): Progress {
  const sessions = storyProgress.gameSessions;
  const latestSession = sessions[sessions.length - 1];

  return {
    storyId: storyProgress.storyId,
    status: mapContentStatusToProgressStatus(storyProgress.status),
    totalTimeSpent: storyProgress.totalTimeSpentSeconds,
    gameSession: sessions.length
      ? {
          chapterId: latestSession?.chapterId ?? null,
          checkpoints: sessions.flatMap((session) =>
            session.checkpoints.map((checkpoint) => ({
              gameSessionId: session.id,
              startedAt: checkpoint.startedAt,
              pausedAt: checkpoint.pausedAt,
              sessionDurationSeconds: checkpoint.sessionDurationSeconds,
            })),
          ),
          readingMetrics: sessions.flatMap((session) =>
            session.readingMetrics.map((metric) => ({
              chapterId: metric.chapterId,
              timeSpentSeconds: metric.timeSpentSeconds,
              updatedAt: metric.updatedAt,
            })),
          ),
          challengeAttempts: sessions.flatMap((session) =>
            session.challengeAttempts.map((attempt) => ({
              id: attempt.id,
              challengeId: attempt.challengeId,
              attemptNumber: attempt.attemptNumber,
              isCorrect: attempt.isCorrect,
              status: attempt.status,
              timeSpentSeconds: attempt.timeSpentSeconds,
              usedHints: attempt.hintsUsed,
              createdAt: attempt.createdAt,
              textAnswer: attempt.textAnswer,
              answerId: attempt.answerId,
              submittedAnswerJson: attempt.submittedAnswerJson,
              speechAccuracy: attempt.speechAccuracy,
              actions: attempt.actions.map((action) => ({
                id: action.id,
                selectedAnswerId: action.selectedAnswerId,
                selectedAnswerText: action.selectedAnswerText,
                answerText: action.answerText,
                submittedOrderJson: action.submittedOrderJson,
                isCorrect: action.isCorrect,
                attemptNumberAtAction: action.attemptNumberAtAction,
              })),
            })),
          ),
        }
      : undefined,
  };
}

function collectStories(
  storyProgress: ChildWithDashboardRelations["storyProgress"],
): Story[] {
  const stories = new Map<string, Story>();

  for (const progress of storyProgress) {
    const story = progress.story;
    if (!story || stories.has(story.id)) continue;

    stories.set(story.id, {
      id: story.id,
      title: story.title,
      translations: story.translations.map((t) => ({
        languageCode: t.languageCode,
        title: t.title,
        description: t.description,
      })),
      chapters: story.chapters.map((chapter) => {
        const chapterChallenge = story.challenges.find(
          (challenge) => challenge.placementChapterId === chapter.id,
        );
        return {
          id: chapter.id,
          order: chapter.order,
          challenge: chapterChallenge ? mapChallenge(chapterChallenge) : null,
        };
      }),
      challenges: story.challenges.map(mapChallenge),
    });
  }

  return Array.from(stories.values());
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return Math.max(age, 0);
}

export function toChildProfile(
  child: ChildWithDashboardRelations,
): ChildProfile {
  const age = child.birthDate ? calculateAge(child.birthDate) : 0;

  const activeStoryIds = new Set(
    child.roadmaps.flatMap((roadmap) =>
      roadmap.worlds.flatMap((world) => world.stories.map((s) => s.id)),
    ),
  );

  const filteredStoryProgress =
    activeStoryIds.size > 0
      ? child.storyProgress.filter((p) => activeStoryIds.has(p.storyId))
      : child.storyProgress;

  return {
    id: child.id,
    childId: child.id,
    child: {
      name: child.name,
      avatar: null,
    },
    name: child.name,
    birthDate: child.birthDate || undefined,
    age: age,
    gender: child.gender,
    totalStars: child.totalStars,
    currentLevel: child.currentLevel,
    readingLevel: child.readingLevel,
    primaryLanguage: child.primaryLanguage,
    activateNotifications: child.activateNotifications,
    activateWeeklyReports: false,
    storiesPerWeek: child.storiesPerWeek,
    sessionDurationMins: child.sessionDurationMins,
    favoriteThemes: child.interests,
    interests: child.interests,
    progress: filteredStoryProgress.map(mapStoryProgressToProgress),
    badges: child.badges.map((entry) => ({ badgeId: entry.badgeId })),
    dailyActivity: child.dailyActivity
      ? {
          lastActiveAt: child.dailyActivity.lastActiveAt,
          currentStreak: child.dailyActivity.currentStreak,
          longestStreak: child.dailyActivity.longestStreak,
        }
      : undefined,
    createdAt: child.createdAt,
    stories: collectStories(filteredStoryProgress),
  };
}

export function buildDashboardAgeGroups() {
  const roadmaps = INTEREST_OPTIONS.map((interest) => ({
    id: interest,
    themeId: interest,
    theme: { id: interest, name: interest },
  }));

  return [
    { id: "5-8", name: "5-8 years", minAge: 5, maxAge: 8, roadmaps },
    { id: "9-11", name: "9-11 years", minAge: 9, maxAge: 11, roadmaps },
    { id: "12-14", name: "12-14 years", minAge: 12, maxAge: 14, roadmaps },
  ];
}

export function getAgeGroupForChildAge(age: number) {
  const groups = buildDashboardAgeGroups();
  return (
    groups.find(
      (group) =>
        (group.minAge === undefined || age >= group.minAge) &&
        (group.maxAge === undefined || age <= group.maxAge),
    ) ?? groups[0]
  );
}

export { childProfileInclude };
