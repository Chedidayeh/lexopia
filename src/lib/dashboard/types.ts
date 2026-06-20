/**
 * Dashboard view-model types aligned with the current Prisma schema.
 * Replaces the legacy @Lexopia/shared-types package for parent-dashboard UI.
 */

export {
  RoleType,
  LanguageCode,
  Local,
  ProgressStatus,
  ChallengeStatus,
  ChallengeType,
  ReadingLevel,
  ContentStatus,
} from "@/src/types/types";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  newUser?: boolean;
};

export type ParentUser = User;

export type Theme = {
  id: string;
  name: string;
};

export type AgeGroup = {
  id: string;
  name: string;
  minAge?: number;
  maxAge?: number;
  roadmaps?: {
    id: string;
    themeId: string;
    theme: Theme;
  }[];
};

export type BadgeTranslation = {
  languageCode: string;
  name: string;
  description?: string | null;
};

export type Level = {
  levelNumber: number;
  requiredStars: number;
};

export type Badge = {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  level?: Level;
  translations?: BadgeTranslation[];
};

export type AttemptAction = {
  id: string;
  selectedAnswerId?: string | null;
  selectedAnswerText?: string | null;
  answerText?: string | null;
  submittedOrderJson?: unknown;
  isCorrect?: boolean | null;
  attemptNumberAtAction: number;
};

export type ChallengeAttempt = {
  id: string;
  challengeId: string;
  attemptNumber: number;
  isCorrect?: boolean | null;
  status: string;
  timeSpentSeconds: number;
  usedHints: number;
  createdAt: Date | string;
  textAnswer?: string | null;
  answerId?: string | null;
  submittedAnswerJson?: unknown;
  speechAccuracy?: number | null;
  actions?: AttemptAction[];
};

export type SessionCheckpoint = {
  gameSessionId: string;
  startedAt: Date | string;
  pausedAt?: Date | string | null;
  sessionDurationSeconds: number;
};

export type GameSession = {
  chapterId?: string | null;
  challengeAttempts?: ChallengeAttempt[];
  checkpoints?: SessionCheckpoint[];
  readingMetrics?: ChapterReadingMetric[];
};

export type ChapterReadingMetric = {
  chapterId: string;
  timeSpentSeconds: number;
  updatedAt: Date | string;
};

export type Progress = {
  storyId?: string;
  status: string;
  totalTimeSpent?: number;
  gameSession?: GameSession;
};

export type StoryTranslation = {
  languageCode: string;
  title: string;
  description?: string | null;
};

export type ChapterTranslation = {
  languageCode: string;
  content: string;
  audioUrl: string;
};

export type ChallengeTranslation = {
  languageCode: string;
  question: string;
  audioUrl?: string;
  sentenceTemplate?: string | null;
  hints?: string[];
};

export type Challenge = {
  id: string;
  type: string;
  storyId?: string;
  question?: string;
  audioUrl?: string;
  imageUrl?: string | null;
  baseStars?: number;
  targetWord?: string | null;
  correctAnswerBoolean?: boolean | null;
  sentenceTemplate?: string | null;
  blankIndex?: number | null;
  correctAnswerJson?: unknown;
  translations?: ChallengeTranslation[];
  answers?: {
    id: string;
    text?: string;
    order?: number | null;
    isCorrect?: boolean;
    correctSequence?: number | null;
    audioUrl?: string | null;
    letterValue?: string | null;
    translations?: { languageCode: string; text: string }[];
  }[];
  hints?: {
    id: string;
    level: string;
    order: number;
    text?: string | null;
    translations?: { languageCode: string; text?: string | null }[];
  }[];
};

export type Chapter = {
  id: string;
  order?: number;
  content?: string;
  audioUrl?: string;
  imageUrl?: string | null;
  translations?: ChapterTranslation[];
  challenge?: Challenge | null;
};

export type Story = {
  id: string;
  title: string;
  sessionDurationMins?: number;
  translations?: StoryTranslation[];
  chapters?: Chapter[];
  challenges?: Challenge[];
};

export type ChildBadge = {
  badgeId: string;
};

export type ChildProfile = {
  id: string;
  childId: string;
  child?: {
    name: string;
    avatar?: string | null;
  };
  name?: string;
  age?: number;
  gender?: string;
  totalStars?: number;
  currentLevel?: number;
  readingLevel?: string;
  primaryLanguage?: string;
  activateNotifications?: boolean;
  activateWeeklyReports?: boolean;
  storiesPerWeek?: number;
  sessionDurationMins?: number;
  ageGroupId?: string;
  ageGroupName?: string;
  favoriteThemes?: string[];
  interests?: string[];
  progress?: Progress[];
  badges?: ChildBadge[];
  dailyActivity?: {
    lastActiveAt?: Date | string | null;
    currentStreak?: number;
    longestStreak?: number;
  };
  createdAt?: Date | string;
  stories?: Story[];
};

export type WeeklyAnalyticsReport = {
  id?: string;
  weekNumber?: number;
  summary?: string;
  highlights?: string[];
  recommendations?: string[];
  createdAt?: Date | string;
};
