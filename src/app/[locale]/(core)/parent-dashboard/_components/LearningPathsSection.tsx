"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Link } from "@/src/i18n/navigation";
import type { ReadingPlanDetailView } from "@/src/lib/reading-plan/types";
import type { ContentStatus, StoryGenerationStatus } from "@prisma/client";
import {
  BookOpen,
  Globe2,
  Loader2,
  Map,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

function countCompletedStories(plan: ReadingPlanDetailView): number {
  let count = 0;
  for (const roadmap of plan.roadmaps) {
    for (const world of roadmap.worlds) {
      for (const story of world.stories) {
        if (story.progressStatus === "COMPLETED") count++;
      }
    }
  }
  return count;
}

function worldStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
    case "AVAILABLE":
      return "secondary";
    default:
      return "outline";
  }
}

export function EpisodeStatusBadge({
  generationStatus,
  progressStatus,
  isGenerating = false,
  t,
}: {
  generationStatus: StoryGenerationStatus;
  progressStatus: ContentStatus | null;
  isGenerating?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (progressStatus === "COMPLETED") {
    return (
      <Badge variant="secondary" className="text-xs shrink-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
        {t("episodeProgress.completed")}
      </Badge>
    );
  }
  if (progressStatus === "IN_PROGRESS") {
    return (
      <Badge className="text-xs shrink-0 bg-primary/90 hover:bg-primary/90">
        {t("episodeProgress.inProgress")}
      </Badge>
    );
  }
  if (progressStatus === "AVAILABLE" && generationStatus === "READY") {
    return (
      <Badge className="text-xs shrink-0 bg-green-600 hover:bg-green-600">
        {t("episodeProgress.available")}
      </Badge>
    );
  }

  if (isGenerating || generationStatus === "GENERATING") {
    return (
      <Badge
        variant="default"
        className="text-xs shrink-0 inline-flex items-center gap-1"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("episodeGeneration.generating")}
      </Badge>
    );
  }

  const generationKey = `episodeGeneration.${generationStatus.toLowerCase()}` as
    | "episodeGeneration.pending"
    | "episodeGeneration.generating"
    | "episodeGeneration.ready"
    | "episodeGeneration.failed";

  const variant =
    generationStatus === "READY"
      ? "default"
      : generationStatus === "FAILED"
        ? "destructive"
        : "outline";

  return (
    <Badge variant={variant} className="text-xs shrink-0">
      {t(generationKey)}
    </Badge>
  );
}

function ParentEpisodeRow({
  story,
  displayPlan,
  canGenerateStory,
  isGeneratingStory,
  onRequestGenerate,
  t,
}: {
  story: ReadingPlanDetailView["roadmaps"][number]["worlds"][number]["stories"][number];
  displayPlan: ReadingPlanDetailView;
  canGenerateStory: boolean;
  isGeneratingStory: boolean;
  onRequestGenerate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const isNextStory =
    displayPlan.nextStoryToGenerate?.storyId === story.id;
  const showGenerateButton =
    canGenerateStory &&
    isNextStory &&
    (story.generationStatus === "PENDING" || story.generationStatus === "FAILED");
  const canPreviewStory = story.generationStatus === "READY";
  const isInProgress = story.progressStatus === "IN_PROGRESS";
  const isCompleted = story.progressStatus === "COMPLETED";

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isNextStory
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-900"
          : isInProgress
            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
            : isCompleted
              ? "border-green-200/60 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20"
              : "border-black/10 bg-card"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0 flex-1">
          {story.episodeNumber != null && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("episodeLabel", { number: story.episodeNumber })}
            </p>
          )}
          <p className="font-heading text-base md:text-lg text-foreground mt-0.5">
            {story.episodeTitle || story.title}
          </p>

          {story.plannedChallengeTypes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground">
                {t("challengesLabel")}:
              </span>
              {story.plannedChallengeTypes.map((type) => (
                <Badge
                  key={`${story.id}-${type}`}
                  variant="secondary"
                  className="px-1.5 py-0 text-xs font-normal"
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canPreviewStory && (
            <Button size="sm" variant="outline" className="h-8" asChild>
              <Link
                target="_blank"
                href={`/story-preview-interface/${story.id}`}
              >
                <BookOpen className="h-3.5 w-3.5 me-1" />
                {t("previewStory")}
              </Link>
            </Button>
          )}
          {showGenerateButton && (
            <Button
              size="sm"
              disabled={
                isGeneratingStory || story.generationStatus === "GENERATING"
              }
              onClick={onRequestGenerate}
            >
              {isGeneratingStory || story.generationStatus === "GENERATING" ? (
                <Loader2 className="h-3 w-3 me-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 me-1" />
              )}
              {t("generateStoryButton")}
            </Button>
          )}
          <EpisodeStatusBadge
            generationStatus={story.generationStatus}
            progressStatus={story.progressStatus}
            isGenerating={
              isGeneratingStory &&
              displayPlan.nextStoryToGenerate?.storyId === story.id
            }
            t={t}
          />
          {story.isTtsGenerating && story.generationStatus === "READY" && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 inline-flex items-center gap-1"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("generatingAudio")}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface LearningPathsSectionProps {
  displayPlan: ReadingPlanDetailView;
  canGenerateStory: boolean;
  isGeneratingStory: boolean;
  onRequestGenerateStory: () => void;
}

export default function LearningPathsSection({
  displayPlan,
  canGenerateStory,
  isGeneratingStory,
  onRequestGenerateStory,
}: LearningPathsSectionProps) {
  const t = useTranslations("ParentDashboard.readingPlanTab");
  const tOnboarding = useTranslations("Onboarding");

  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(
    displayPlan.roadmaps[0]?.id ?? null,
  );

  const effectiveRoadmapId = useMemo(() => {
    if (
      activeRoadmapId &&
      displayPlan.roadmaps.some((roadmap) => roadmap.id === activeRoadmapId)
    ) {
      return activeRoadmapId;
    }
    return displayPlan.roadmaps[0]?.id ?? null;
  }, [activeRoadmapId, displayPlan.roadmaps]);

  const completedCount = useMemo(
    () => countCompletedStories(displayPlan),
    [displayPlan],
  );

  const progressPercent =
    displayPlan.totalStories > 0
      ? Math.round((completedCount / displayPlan.totalStories) * 100)
      : 0;

  const activeRoadmap = displayPlan.roadmaps.find(
    (roadmap) => roadmap.id === effectiveRoadmapId,
  );

  return (
    <div className="rounded-2xl border border-black/10 bg-card p-5 md:p-6 shadow-warm-lg space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl md:text-2xl text-foreground flex items-center gap-2">
            <Map className="h-5 w-5 text-primary shrink-0" />
            {t("roadmapsTitle", { count: displayPlan.roadmaps.length })}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pathsOverviewHint")}
          </p>
        </div>
        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pathsProgress")}</span>
            <span className="font-medium">
              {t("pathsProgressCount", {
                completed: completedCount,
                total: displayPlan.totalStories,
                ready: displayPlan.readyStories,
              })}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>
      </div>

      {displayPlan.roadmaps.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {displayPlan.roadmaps.map((roadmap) => {
            const roadmapTitle =
              roadmap.title ||
              tOnboarding(`interests.${roadmap.interest}`, {
                defaultValue: roadmap.interest,
              });

            return (
              <Button
                key={roadmap.id}
                variant={effectiveRoadmapId === roadmap.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveRoadmapId(roadmap.id)}
              >
                {roadmapTitle}
              </Button>
            );
          })}
        </div>
      )}

      {activeRoadmap && (
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/15 bg-linear-to-r from-primary/5 to-transparent px-4 py-3">
            <p className="font-medium text-foreground">
              {activeRoadmap.title ||
                tOnboarding(`interests.${activeRoadmap.interest}`, {
                  defaultValue: activeRoadmap.interest,
                })}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("worldCount", { count: activeRoadmap.worlds.length })}
            </p>
          </div>

          {activeRoadmap.worlds.map((world) => (
            <div
              key={world.id}
              className="rounded-xl border border-black/10 bg-background/80 overflow-hidden"
            >
              <div className="flex items-start gap-3 p-4 md:p-5 border-b border-black/10 bg-muted/20">
                <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                  <Globe2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-heading text-lg text-foreground">
                      {world.name}
                    </h4>
                    <Badge
                      variant={worldStatusVariant(world.status)}
                      className="text-xs shrink-0"
                    >
                      {t(
                        `worldStatus.${world.status.toLowerCase()}` as "worldStatus.locked",
                      )}
                    </Badge>
                  </div>
                  {world.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {world.description}
                    </p>
                  )}
                </div>
              </div>

              {world.storyArc && (
                <div className="mx-4 md:mx-5 mt-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {world.storyArc.title}
                  </p>
                  {world.storyArc.synopsis && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {world.storyArc.synopsis}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("arcEpisodes", {
                      count: world.storyArc.targetEpisodes,
                    })}
                  </p>
                </div>
              )}

              <div className="p-4 md:p-5 space-y-3">
                {[...world.stories]
                  .sort((a, b) => a.order - b.order)
                  .map((story, index, sorted) => (
                    <div key={story.id} className="relative flex gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium border-2 ${
                            story.progressStatus === "COMPLETED"
                              ? "border-green-600 bg-green-600 text-white"
                              : story.progressStatus === "IN_PROGRESS"
                                ? "border-primary bg-primary/15 text-primary"
                                : story.generationStatus === "READY"
                                  ? "border-primary/40 bg-background text-foreground"
                                  : "border-muted bg-muted text-muted-foreground"
                          }`}
                        >
                          {story.progressStatus === "COMPLETED"
                            ? "✓"
                            : index + 1}
                        </div>
                        {index < sorted.length - 1 && (
                          <div className="w-0.5 flex-1 min-h-4 mt-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <ParentEpisodeRow
                          story={story}
                          displayPlan={displayPlan}
                          canGenerateStory={canGenerateStory}
                          isGeneratingStory={isGeneratingStory}
                          onRequestGenerate={onRequestGenerateStory}
                          t={t}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
