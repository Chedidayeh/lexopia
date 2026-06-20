import type { Metadata } from "next";
import StoryReadingInteractive from "../_components/StoryReadingInteractive";
import MissingDataAlert from "@/src/components/shared/MissingDataAlert";
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import {
  getStoryByIdForUser,
  storyHasReadableContent,
} from "@/src/lib/story-reading/queries";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Story Reading - Readdly",
  description:
    "Immerse yourself in interactive stories with narrated audio, adjustable settings, and embedded challenges for an engaging learning experience.",
};

export const dynamic = "force-dynamic";

export default async function StoryPreviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const t = await getTranslations("StoryReadingInterface");
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  if (!id) {
    return <MissingDataAlert message={t("missingRequiredParameters")} />;
  }

  const story = await getStoryByIdForUser(
    id,
    session.user.id,
    session.user.role,
  );

  if (!story) {
    return <MissingDataAlert message={t("storyNotFound")} />;
  }

  if (!storyHasReadableContent(story)) {
    return <MissingDataAlert message={t("storyNotReady")} />;
  }


  return <StoryReadingInteractive story={story}  />;
}
