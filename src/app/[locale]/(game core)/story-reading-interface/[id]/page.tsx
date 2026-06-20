import type { Metadata } from "next";

import StoryReadingInteractive from "../_components/StoryReadingInteractive";

import MissingDataAlert from "@/src/components/shared/MissingDataAlert";

import { auth } from "@/src/auth";

import { redirect } from "next/navigation";

import {

  getStoryByIdForChild,

  storyHasReadableContent,

} from "@/src/lib/story-reading/queries";

import {

  assertChildBelongsToUser,

  getChildStoryReadingProgress,
  getChildStoryChallengeProgress,
  resolveInitialStoryPage,
} from "@/src/lib/story-progress/queries";

import { getTranslations } from "next-intl/server";



export const metadata: Metadata = {

  title: "Story Reading - Readdly",

  description:

    "Immerse yourself in interactive stories with narrated audio, adjustable settings, and embedded challenges for an engaging learning experience.",

};



export const dynamic = "force-dynamic";



export default async function StoryReadingPage({

  params,

  searchParams,

}: {

  params: Promise<{ id: string; locale: string }>;

  searchParams: Promise<{ childId?: string }>;

}) {

  const t = await getTranslations("StoryReadingInterface");

  const session = await auth();



  if (!session?.user?.id) {

    redirect("/");

  }



  const { id } = await params;

  const { childId } = await searchParams;



  if (!id) {

    return <MissingDataAlert message={t("missingRequiredParameters")} />;

  }



  if (!childId) {

    return <MissingDataAlert message={t("unableToStartStory")} />;

  }



  const child = await assertChildBelongsToUser(

    childId,

    session.user.id,

    session.user.role,

  );



  if (!child) {

    return <MissingDataAlert message={t("childNotFound")} />;

  }



  const story = await getStoryByIdForChild(

    id,

    childId,

    session.user.id,

    session.user.role,

  );



  if (!story) {

    return <MissingDataAlert message={t("storyNotFound")} />;

  }



  if (!storyHasReadableContent(story)) {

    return <MissingDataAlert message={t("storyNotReady")} />;

  }



  const [storyProgress, challengeProgress] = await Promise.all([
    getChildStoryReadingProgress(childId, id),
    getChildStoryChallengeProgress(childId, id),
  ]);

  const totalChapters = story.chapters?.length ?? 0;

  const initialPage = resolveInitialStoryPage(storyProgress, totalChapters);

  const sessionDurationMins =

    story.sessionDurationMins ?? child.sessionDurationMins;



  return (

    <StoryReadingInteractive

      story={story}

      childId={childId}

      initialPage={initialPage}

      sessionDurationMins={sessionDurationMins}

      storyProgress={storyProgress}
      challengeProgress={challengeProgress}

    />

  );

}

