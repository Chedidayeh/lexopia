import { prisma } from "@/src/lib/prisma";
import type { Story } from "@/src/lib/dashboard/types";
import { RoleType } from "@/src/types/types";
import {
  getStoryParentId,
  storyReadingInclude,
  toReadingStory,
} from "./map-story";

export async function canUserAccessStory(
  userId: string,
  role: string,
  storyId: string,
): Promise<boolean> {
  if (role === RoleType.ADMIN) {
    return true;
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      world: {
        include: {
          roadmap: {
            include: {
              child: { select: { parentId: true } },
            },
          },
        },
      },
    },
  });

  if (!story) {
    return false;
  }

  if (role === RoleType.PARENT) {
    return story.world?.roadmap?.child?.parentId === userId;
  }

  return false;
}

export async function getStoryById(storyId: string): Promise<Story | null> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: storyReadingInclude,
  });

  if (!story) {
    return null;
  }

  return toReadingStory(story);
}

export async function getStoryByIdForUser(
  storyId: string,
  userId: string,
  role: string,
): Promise<Story | null> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: storyReadingInclude,
  });

  if (!story) {
    return null;
  }

  if (role !== RoleType.ADMIN) {
    const parentId = getStoryParentId(story);
    if (role === RoleType.PARENT && parentId !== userId) {
      return null;
    }
    if (role !== RoleType.PARENT) {
      return null;
    }
    if (story.world?.roadmap && !story.world.roadmap.isActive) {
      return null;
    }
  }

  return toReadingStory(story);
}

export function storyHasReadableContent(story: Story): boolean {
  return (story.chapters?.length ?? 0) > 0;
}

export async function getStoryByIdForChild(
  storyId: string,
  childId: string,
  userId: string,
  role: string,
): Promise<Story | null> {
  const story = await prisma.story.findFirst({
    where: {
      id: storyId,
      world: {
        roadmap: {
          childId,
        },
      },
    },
    include: storyReadingInclude,
  });

  if (!story) {
    return null;
  }

  if (role !== RoleType.ADMIN) {
    const parentId = getStoryParentId(story);
    if (role === RoleType.PARENT && parentId !== userId) {
      return null;
    }
    if (role !== RoleType.PARENT) {
      return null;
    }
  }

  return toReadingStory(story);
}
