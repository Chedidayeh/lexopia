import type { Metadata } from "next";
import StoryReadingInteractive from "../_components/StoryReadingInteractive";
import MissingDataAlert from "@/src/components/shared/MissingDataAlert";
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import {
  getStoryById,
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
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ childId?: string; preview?: string }>;
}) {
  const t = await getTranslations("StoryReadingInterface");
  const session = await auth();

  const [{ id }, query] = await Promise.all([params, searchParams]);

  // Allow access for preview mode without authentication
  const isPreviewMode = query.preview === "true";

  if (!isPreviewMode && !session?.user?.id) {
    redirect("/");
  }

  if (!id) {
    return <MissingDataAlert message={t("missingRequiredParameters")} />;
  }

  // In preview mode, use getStoryById which doesn't check user access
  // Otherwise use getStoryByIdForUser for proper access control
  const story = isPreviewMode
    ? await getStoryById(id)
    : await getStoryByIdForUser(id, session?.user?.id || "", session?.user?.role || "parent");

  if (!story) {
    return <MissingDataAlert message={t("storyNotFound")} />;
  }

  if (!storyHasReadableContent(story)) {
    return <MissingDataAlert message={t("storyNotReady")} />;
  }


  return <StoryReadingInteractive story={story} childId={query.childId} isPreviewMode={isPreviewMode} />;
}
