import "server-only";

import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  StoryGenerationStatus,
} from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requestChildOrchestration } from "@/src/lib/orchestration/request-orchestration";
import {
  buildTtsInputSnapshot,
  collectTtsContext,
} from "./collect-tts-context";
import { shouldSynthesizeChapter } from "./chapter-tts-helpers";
import { buildStoryChallengeTtsTargets } from "./challenge-tts-targets";
import { shouldSynthesizeTarget } from "./challenge-tts-helpers";
import {
  type ChallengeTtsStepResult,
  synthesizeAndPersistChallengeTarget,
} from "./process-challenge-tts";
import { synthesizeAndPersistChapter } from "./process-chapter-tts";
import { sendParentStoryGeneratedEmail } from "@/src/lib/notifications/parent-generation-notifications";

type ChapterTtsStepResult = {
  chapterId: string;
  audioUrl: string;
  skipped: boolean;
};

type TtsStepResult = ChapterTtsStepResult | ChallengeTtsStepResult;

/** Matches Inngest step.run — return is widened because Inngest jsonifies step outputs. */
type TtsStepRunner = {
  run: (name: string, fn: () => Promise<TtsStepResult>) => Promise<unknown>;
};

function buildChallengeStepName(
  challengeOrder: number,
  target: { kind: string; order?: number; answerId?: string },
): string {
  if (target.kind === "challenge-question") {
    return `challenge-${challengeOrder}-question`;
  }

  return `challenge-${challengeOrder}-answer-${target.order}`;
}

async function markTtsFailed(params: {
  agentJobId: string;
  storyId: string;
  childId: string;
  readingPlanId: string;
  storyArcId: string | null;
  inputSnapshot: object;
  errorMessage: string;
  startedAt: number;
  outputSnapshot?: object;
}) {
  const {
    agentJobId,
    storyId,
    childId,
    readingPlanId,
    storyArcId,
    inputSnapshot,
    errorMessage,
    startedAt,
    outputSnapshot,
  } = params;

  await prisma.$transaction([
    prisma.agentJob.update({
      where: { id: agentJobId },
      data: {
        status: AgentJobStatus.FAILED,
        completedAt: new Date(),
        error: errorMessage,
        inputSnapshot,
        outputSnapshot: outputSnapshot ?? { error: errorMessage },
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.TTS,
        trigger: AgentTrigger.MANUAL_REGENERATION,
        childId,
        readingPlanId,
        storyArcId,
        storyId,
        inputSnapshot,
        outputSnapshot: outputSnapshot ?? { error: errorMessage },
        error: errorMessage,
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);
}

export async function runTtsAgent(params: {
  storyId: string;
  agentJobId: string;
  step?: TtsStepRunner;
}): Promise<void> {
  const { storyId, agentJobId, step } = params;
  const startedAt = Date.now();

  const latestJob = await prisma.agentJob.findFirst({
    where: { storyId, agentType: AgentType.TTS },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (latestJob?.id !== agentJobId) {
    return;
  }

  const context = await collectTtsContext(storyId);
  if (!context) {
    throw new Error(`Story ${storyId} not found for TTS`);
  }

  if (context.chapters.length === 0) {
    throw new Error(`Story ${storyId} has no chapters to narrate`);
  }

  const inputSnapshot = buildTtsInputSnapshot(context);
  const chapterResults: ChapterTtsStepResult[] = [];
  const challengeResults: ChallengeTtsStepResult[] = [];
  const challengeTargets = buildStoryChallengeTtsTargets(context.challenges);
  const challengeById = new Map(
    context.challenges.map((challenge) => [challenge.id, challenge]),
  );

  try {
    for (const chapter of context.chapters) {
      if (!shouldSynthesizeChapter(chapter)) {
        chapterResults.push({
          chapterId: chapter.id,
          audioUrl: chapter.audioUrl,
          skipped: true,
        });
        continue;
      }

      const stepName = `chapter-${chapter.order}`;
      const result = (step
        ? await step.run(stepName, () =>
            synthesizeAndPersistChapter({ context, chapter }),
          )
        : await synthesizeAndPersistChapter({ context, chapter })) as ChapterTtsStepResult;

      chapterResults.push(result);
    }

    for (const target of challengeTargets) {
      const challenge = challengeById.get(target.challengeId);
      if (!challenge) {
        continue;
      }

      if (!shouldSynthesizeTarget(target, challenge)) {
        if (target.kind === "challenge-question") {
          challengeResults.push({
            targetKind: target.kind,
            challengeId: challenge.id,
            audioUrl: challenge.audioUrl,
            skipped: true,
          });
        } else {
          const answer = challenge.answers.find(
            (entry) => entry.id === target.answerId,
          );
          challengeResults.push({
            targetKind: target.kind,
            challengeId: challenge.id,
            answerId: target.answerId,
            audioUrl: answer?.audioUrl ?? "",
            skipped: true,
          });
        }
        continue;
      }

      const stepName = buildChallengeStepName(challenge.order, target);
      const result = (step
        ? await step.run(stepName, () =>
            synthesizeAndPersistChallengeTarget({ context, challenge, target }),
          )
        : await synthesizeAndPersistChallengeTarget({
            context,
            challenge,
            target,
          })) as ChallengeTtsStepResult;

      challengeResults.push(result);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "TTS agent failed";

    await markTtsFailed({
      agentJobId,
      storyId,
      childId: context.childId,
      readingPlanId: context.readingPlanId,
      storyArcId: context.storyArcId,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: { chapterResults, challengeResults, error: errorMessage },
    });

    throw new Error(errorMessage);
  }

  const generatedChapterCount = chapterResults.filter(
    (entry) => !entry.skipped,
  ).length;
  const generatedChallengeCount = challengeResults.filter(
    (entry) => !entry.skipped,
  ).length;

  await prisma.$transaction([
    prisma.agentJob.update({
      where: { id: agentJobId },
      data: {
        status: AgentJobStatus.SUCCEEDED,
        attemptCount: { increment: 1 },
        completedAt: new Date(),
        inputSnapshot,
        outputSnapshot: {
          chapterResults,
          challengeResults,
          generatedChapterCount,
          generatedChallengeCount,
          generatedCount: generatedChapterCount + generatedChallengeCount,
        },
      },
    }),
    prisma.story.update({
      where: { id: storyId },
      data: {
        generationStatus: StoryGenerationStatus.READY,
        generationCompletedAt: new Date(),
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.TTS,
        trigger: AgentTrigger.MANUAL_REGENERATION,
        childId: context.childId,
        readingPlanId: context.readingPlanId,
        storyArcId: context.storyArcId,
        storyId,
        inputSnapshot,
        outputSnapshot: {
          chapterResults,
          challengeResults,
          generatedChapterCount,
          generatedChallengeCount,
          generatedCount: generatedChapterCount + generatedChallengeCount,
        },
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);

  try {
    await requestChildOrchestration(
      context.childId,
      AgentTrigger.STORY_UNLOCK,
    );
  } catch (error) {
    console.error("Failed to request post-TTS orchestration:", error);
  }

  try {
    await sendParentStoryGeneratedEmail(storyId);
  } catch (error) {
    console.error("Failed to send story email notification:", error);
  }
}
