"use client";

import { BookMarked, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import type { ReadingPlanEpisodeView } from "@/src/lib/reading-plan/types";
import {
  getChildStoryAccess,
  getStoryDisplayTitle,
  isStoryReadable,
  type ChildStoryAccess,
} from "../../_lib/reading-plan-helpers";
import type { ReadingPlanWorldView } from "@/src/lib/reading-plan/types";

function accessBadgeVariant(access: ChildStoryAccess) {
  switch (access.kind) {
    case "completed":
      return "secondary" as const;
    case "continue":
      return "default" as const;
    case "start":
      return "default" as const;
    default:
      return "outline" as const;
  }
}

function accessLabel(
  access: ChildStoryAccess,
  t: ReturnType<typeof useTranslations>,
) {
  if (access.kind === "generating") return t("readingPlan.generatingStory");
  if (access.kind === "locked") {
    if (access.reason === "not_ready") return t("readingPlan.comingSoon");
    if (access.reason === "world_locked") return t("readingPlan.worldLocked");
    return t("readingPlan.locked");
  }
  if (access.kind === "completed") return t("readingPlan.completed");
  if (access.kind === "continue") return t("readingPlan.inProgress");
  return t("readingPlan.readyToRead");
}

export default function StoryEpisodeCard({
  childId,
  story,
  world,
  previousStory,
  index,
  isLast,
}: {
  childId: string;
  story: ReadingPlanEpisodeView;
  world: ReadingPlanWorldView;
  previousStory: ReadingPlanEpisodeView | null;
  index: number;
  isLast: boolean;
}) {
  const t = useTranslations("ChildDashboard");
  const access = getChildStoryAccess(story, world, previousStory);
  const readable = isStoryReadable(access);
  const title = getStoryDisplayTitle(story);

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
            access.kind === "completed"
              ? "border-primary bg-primary text-primary-foreground"
              : access.kind === "continue"
                ? "border-primary bg-primary/15 text-primary"
                : readable
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-muted bg-muted text-muted-foreground"
          }`}
        >
          {access.kind === "completed" ? "✓" : index + 1}
        </div>
        {!isLast && (
          <div
            className={`mt-1 w-0.5 flex-1 min-h-8 ${
              access.kind === "completed" ? "bg-primary/40" : "bg-border"
            }`}
          />
        )}
      </div>

      <div
        className={`mb-4 flex-1 rounded-xl border p-4 transition-all ${
          access.kind === "continue"
            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
            : readable
              ? "border-primary/25 bg-card hover:shadow-sm"
              : "border-black/10 bg-muted/20 opacity-90"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {story.episodeNumber != null && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("readingPlan.episodeLabel", { number: story.episodeNumber })}
              </p>
            )}
            <h4 className="font-heading text-lg text-foreground mt-0.5">
              {title}
            </h4>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={accessBadgeVariant(access)} className="text-xs">
                {accessLabel(access, t)}
              </Badge>
            </div>
          </div>

          <div className="shrink-0 rounded-full p-2.5 bg-muted/60">
            {!readable ? (
              access.kind === "generating" ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Lock className="h-3 w-3 text-secondary" />
              )
            ) : (
              <BookMarked className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>

        {readable && (
          <div className="mt-4">
            <Button size="sm" variant={access.kind === "completed" ? "outline" : "default"} asChild>
              <Link
                target="_blank"
                href={
                  access.kind === "completed"
                    ? `/story-preview-interface/${story.id}?childId=${childId}`
                    : `/story-reading-interface/${story.id}?childId=${childId}`
                }
              >
                {access.kind === "continue"
                  ? t("readingPlan.continueReading")
                  : access.kind === "completed"
                    ? t("readingPlan.readAgain")
                    : t("readingPlan.startReading")}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
