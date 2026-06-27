import "server-only";

import { StoryGenerationStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

/**
 * Get the start of the current week (Monday at 00:00:00)
 */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Count stories generated for a child in the current week
 */
export async function countStoriesGeneratedThisWeek(childId: string): Promise<number> {
  const weekStart = getWeekStart();

  const count = await prisma.story.count({
    where: {
      world: {
        roadmap: {
          childId,
        },
      },
      generationStatus: StoryGenerationStatus.READY,
      generationCompletedAt: {
        gte: weekStart,
      },
    },
  });

  return count;
}

/**
 * Check if a child can generate more stories this week
 */
export async function canGenerateStoryThisWeek(
  childId: string,
  storiesPerWeek: number,
): Promise<{ canGenerate: boolean; generatedCount: number; remaining: number }> {
  const generatedCount = await countStoriesGeneratedThisWeek(childId);
  const remaining = storiesPerWeek - generatedCount;
  const canGenerate = remaining > 0;

  return { canGenerate, generatedCount, remaining };
}
