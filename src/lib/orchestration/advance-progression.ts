import "server-only";

import { ContentStatus, ReadingPlanStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

type WorldWithStories = {
  id: string;
  order: number;
  status: ContentStatus;
  stories: { id: string; order: number }[];
};

async function allStoriesCompleted(
  childId: string,
  storyIds: string[],
): Promise<boolean> {
  if (storyIds.length === 0) {
    return false;
  }

  const completedCount = await prisma.childStoryProgress.count({
    where: {
      childId,
      storyId: { in: storyIds },
      status: ContentStatus.COMPLETED,
    },
  });

  return completedCount === storyIds.length;
}

async function unlockWorldFirstStory(
  childId: string,
  world: WorldWithStories,
): Promise<void> {
  const sortedStories = [...world.stories].sort((a, b) => a.order - b.order);
  const firstStory = sortedStories[0];
  if (!firstStory) {
    return;
  }

  await prisma.$transaction([
    prisma.world.update({
      where: { id: world.id },
      data: { status: ContentStatus.AVAILABLE },
    }),
    prisma.childStoryProgress.updateMany({
      where: {
        childId,
        storyId: firstStory.id,
        status: ContentStatus.LOCKED,
      },
      data: { status: ContentStatus.AVAILABLE },
    }),
  ]);
}

async function advanceRoadmapWorlds(
  childId: string,
  worlds: WorldWithStories[],
): Promise<void> {
  const sortedWorlds = [...worlds].sort((a, b) => a.order - b.order);

  for (let index = 0; index < sortedWorlds.length; index++) {
    const world = sortedWorlds[index];
    const storyIds = world.stories.map((story) => story.id);
    const worldComplete = await allStoriesCompleted(childId, storyIds);

    if (!worldComplete) {
      continue;
    }

    const nextWorld = sortedWorlds[index + 1];
    if (nextWorld && nextWorld.status === ContentStatus.LOCKED) {
      await unlockWorldFirstStory(childId, nextWorld);
    }
  }
}

async function activateNextRoadmap(
  childId: string,
  readingPlanId: string,
  currentRoadmapId: string,
): Promise<void> {
  const roadmaps = await prisma.roadmap.findMany({
    where: { readingPlanId },
    orderBy: { order: "asc" },
    include: {
      worlds: {
        orderBy: { order: "asc" },
        include: {
          stories: {
            orderBy: { order: "asc" },
            select: { id: true, order: true },
          },
        },
      },
    },
  });

  const currentIndex = roadmaps.findIndex(
    (roadmap) => roadmap.id === currentRoadmapId,
  );
  const nextRoadmap = currentIndex >= 0 ? roadmaps[currentIndex + 1] : null;

  if (!nextRoadmap) {
    return;
  }

  const sortedWorlds = [...nextRoadmap.worlds].sort(
    (a, b) => a.order - b.order,
  );
  const firstWorld = sortedWorlds[0];
  const firstStory = firstWorld?.stories[0];

  await prisma.$transaction(async (tx) => {
    await tx.roadmap.update({
      where: { id: currentRoadmapId },
      data: { isActive: false },
    });

    await tx.roadmap.update({
      where: { id: nextRoadmap.id },
      data: { isActive: true },
    });

    if (firstWorld) {
      await tx.world.update({
        where: { id: firstWorld.id },
        data: { status: ContentStatus.AVAILABLE },
      });
    }

    if (firstStory) {
      await tx.childStoryProgress.updateMany({
        where: {
          childId,
          storyId: firstStory.id,
          status: ContentStatus.LOCKED,
        },
        data: { status: ContentStatus.AVAILABLE },
      });
    }
  });
}

async function isRoadmapFullyCompleted(
  childId: string,
  worlds: WorldWithStories[],
): Promise<boolean> {
  const storyIds = worlds.flatMap((world) => world.stories.map((s) => s.id));
  return allStoriesCompleted(childId, storyIds);
}

export async function advanceChildProgression(
  childId: string,
): Promise<void> {
  const activePlan = await prisma.readingPlan.findFirst({
    where: {
      childId,
      status: ReadingPlanStatus.ACTIVE,
      isActive: true,
    },
    include: {
      roadmaps: {
        where: { isActive: true },
        include: {
          worlds: {
            orderBy: { order: "asc" },
            include: {
              stories: {
                orderBy: { order: "asc" },
                select: { id: true, order: true },
              },
            },
          },
        },
      },
    },
  });

  if (!activePlan) {
    return;
  }

  const activeRoadmap = activePlan.roadmaps[0];
  if (!activeRoadmap) {
    return;
  }

  await advanceRoadmapWorlds(childId, activeRoadmap.worlds);

  const refreshedWorlds = await prisma.world.findMany({
    where: { roadmapId: activeRoadmap.id },
    orderBy: { order: "asc" },
    include: {
      stories: {
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      },
    },
  });

  const roadmapComplete = await isRoadmapFullyCompleted(
    childId,
    refreshedWorlds,
  );

  if (roadmapComplete) {
    await activateNextRoadmap(childId, activePlan.id, activeRoadmap.id);
  }
}
