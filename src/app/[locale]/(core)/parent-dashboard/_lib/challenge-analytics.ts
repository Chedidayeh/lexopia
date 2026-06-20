import type { ChildProfile, Progress, Story } from "@Lexopia/shared-types";
import {
  calculateChallengeStats,
  getAggregatedChallengeStats,
  localizeChallengStatsWithMaps,
  type LocalizedChallengeStats,
} from "./stats";

export type ChallengeAnalytics = {
  challengeStats: ReturnType<typeof calculateChallengeStats>;
  aggregatedStats: ReturnType<typeof getAggregatedChallengeStats>;
  localizedStats: LocalizedChallengeStats[];
  hasAttempts: boolean;
  storyCount: number;
};

function buildStoryMap(stories: Story[]): Map<string, Story> {
  return new Map(stories.map((story) => [story.id, story]));
}

function buildStoryOrder(progress: Progress[]): Map<string, number> {
  const order = new Map<string, number>();
  progress.forEach((entry, index) => {
    if (entry.storyId && !order.has(entry.storyId)) {
      order.set(entry.storyId, index);
    }
  });
  return order;
}

function sortChallengeStats(
  stats: ReturnType<typeof calculateChallengeStats>,
  storyMap: Map<string, Story>,
  storyOrder: Map<string, number>,
) {
  return [...stats].sort((a, b) => {
    const orderA = storyOrder.get(a.storyId) ?? 999;
    const orderB = storyOrder.get(b.storyId) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    if (a.storyId !== b.storyId) return a.storyId.localeCompare(b.storyId);

    const storyA = storyMap.get(a.storyId);
    const storyB = storyMap.get(b.storyId);
    let chapterOrderA = 999;
    let chapterOrderB = 999;

    if (storyA?.chapters) {
      for (const chapter of storyA.chapters) {
        if (chapter.challenge?.id === a.id) {
          chapterOrderA = chapter.order ?? 999;
          break;
        }
      }
    }

    if (storyB?.chapters) {
      for (const chapter of storyB.chapters) {
        if (chapter.challenge?.id === b.id) {
          chapterOrderB = chapter.order ?? 999;
          break;
        }
      }
    }

    return chapterOrderA - chapterOrderB;
  });
}

export function getChallengeAnalytics(
  profile: ChildProfile | undefined,
  locale?: string,
): ChallengeAnalytics {
  const progress = profile?.progress ?? [];
  const stories = profile?.stories ?? [];
  const storyMap = buildStoryMap(stories);
  const storyOrder = buildStoryOrder(progress);

  const challengeStats = calculateChallengeStats(progress);
  const aggregatedStats = getAggregatedChallengeStats(progress);
  const sortedStats = sortChallengeStats(challengeStats, storyMap, storyOrder);
  const localizedStats = localizeChallengStatsWithMaps(
    sortedStats,
    storyMap,
    locale,
  );

  return {
    challengeStats: sortedStats,
    aggregatedStats,
    localizedStats,
    hasAttempts: challengeStats.length > 0,
    storyCount: stories.length,
  };
}
