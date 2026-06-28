import "server-only";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  StoryGenerationStatus,
} from "@prisma/client";
import { createLangChainModel } from "@/src/lib/ai/langchain-model";
import { prisma } from "@/src/lib/prisma";
import {
  buildStoryContentInputSnapshot,
  collectStoryContext,
} from "./collect-story-context";
import { persistStoryContent } from "./persist-story-content";
import {
  buildChallengesUserPrompt,
  buildChaptersUserPrompt,
  buildStoryContentSystemPrompt,
} from "./story-content-prompt";
import {
  storyChallengesSchema,
  storyChaptersSchema,
  normalizeChallengesBlueprint,
  normalizeChaptersBlueprint,
  validateChallengesBlueprint,
  validateChallengesBatch,
  validateChaptersBlueprint,
  type StoryChallengesBlueprint,
  type StoryChaptersBlueprint,
} from "./story-content.schema";
import { enqueueStoryTts } from "@/src/lib/tts/enqueue-story-tts";
import { formatStoryLlmError, getChallengeBatchSize, splitChallengeBatches } from "./story-llm-helpers";
import { sendParentStoryGeneratedEmail } from "@/src/lib/notifications/parent-generation-notifications";

const MAX_LLM_ATTEMPTS = 5;
const STORY_LLM_MAX_OUTPUT_TOKENS = 65536;

async function markStoryContentFailed(params: {
  agentJobId: string;
  storyId: string;
  childId: string;
  readingPlanId: string | null;
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

  // Ensure errorMessage is a string
  const safeErrorMessage = String(errorMessage || "Unknown error");

  // Use inputSnapshot directly but ensure it's an object
  const safeInputSnapshot = inputSnapshot && typeof inputSnapshot === 'object' ? inputSnapshot : { error: "Invalid input snapshot" };

  const safeOutputSnapshot = outputSnapshot ?? { error: safeErrorMessage };

  await prisma.$transaction([
    prisma.agentJob.update({
      where: { id: agentJobId },
      data: {
        status: AgentJobStatus.FAILED,
        completedAt: new Date(),
        error: safeErrorMessage,
        inputSnapshot: safeInputSnapshot,
        outputSnapshot: safeOutputSnapshot,
      },
    }),
    prisma.story.update({
      where: { id: storyId },
      data: {
        generationStatus: StoryGenerationStatus.FAILED,
        generationCompletedAt: new Date(),
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.STORY,
        trigger: AgentTrigger.MANUAL_REGENERATION,
        childId,
        readingPlanId,
        storyArcId,
        storyId,
        inputSnapshot: safeInputSnapshot,
        outputSnapshot: safeOutputSnapshot,
        error: safeErrorMessage,
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);
}

async function generateChaptersWithLlm(
  context: NonNullable<Awaited<ReturnType<typeof collectStoryContext>>>,
  validationFeedback?: string,
): Promise<StoryChaptersBlueprint> {
  const model = createLangChainModel(0.3, {
    maxOutputTokens: STORY_LLM_MAX_OUTPUT_TOKENS,
  }).withStructuredOutput(
    storyChaptersSchema,
  );

  const userPrompt = validationFeedback
    ? `${buildChaptersUserPrompt(context)}\n\nPrevious attempt failed validation:\n${validationFeedback}\n\nReturn corrected chapters.`
    : buildChaptersUserPrompt(context);

  const messages = [
    new SystemMessage(buildStoryContentSystemPrompt()),
    new HumanMessage(userPrompt),
  ];

  return model.invoke(messages);
}

async function generateChallengesWithLlm(
  context: NonNullable<Awaited<ReturnType<typeof collectStoryContext>>>,
  chapters: StoryChaptersBlueprint,
  validationFeedback?: string,
  batch?: { startOrder: number; batchTypes: string[] },
): Promise<StoryChallengesBlueprint> {
  const model = createLangChainModel(0.2, {
    maxOutputTokens: STORY_LLM_MAX_OUTPUT_TOKENS,
  }).withStructuredOutput(
    storyChallengesSchema,
  );

  const chapterSummaries = chapters.chapters.map((chapter) => ({
    order: chapter.order,
    content: chapter.content,
  }));

  const basePrompt = buildChallengesUserPrompt(context, chapterSummaries, batch);
  const userPrompt = validationFeedback
    ? `${basePrompt}\n\nPrevious attempt failed validation:\n${validationFeedback}\n\nReturn corrected challenges.`
    : basePrompt;

  const messages = [
    new SystemMessage(buildStoryContentSystemPrompt()),
    new HumanMessage(userPrompt),
  ];

  return model.invoke(messages);
}

async function generateAllChallengesWithLlm(
  context: NonNullable<Awaited<ReturnType<typeof collectStoryContext>>>,
  chapters: StoryChaptersBlueprint,
): Promise<
  | { success: true; blueprint: StoryChallengesBlueprint }
  | { success: false; error: string }
> {
  const challengeCount = context.story.challengesPerStory;
  const batchSize = getChallengeBatchSize(challengeCount);
  const batches = splitChallengeBatches(challengeCount, batchSize);
  const mergedChallenges: StoryChallengesBlueprint["challenges"] = [];

  for (const batch of batches) {
    const batchTypes = context.plannedChallengeTypes?.slice(
      batch.startIndex,
      batch.startIndex + batch.count,
    ) ?? [];
    let lastBatchError: string | undefined;
    let batchBlueprint: StoryChallengesBlueprint | null = null;

    for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt += 1) {
      try {
        const candidate = normalizeChallengesBlueprint(
          await generateChallengesWithLlm(
            context,
            chapters,
            lastBatchError,
            { startOrder: batch.startOrder, batchTypes },
          ),
          context.story.chaptersPerStory,
        );
        const validation = validateChallengesBatch(candidate, context, {
          startOrder: batch.startOrder,
          expectedTypes: batchTypes,
        });
        if (!validation.valid) {
          lastBatchError = validation.error;
          continue;
        }
        batchBlueprint = candidate;
        break;
      } catch (error) {
        lastBatchError = formatStoryLlmError(error);
      }
    }

    if (!batchBlueprint) {
      return {
        success: false,
        error:
          lastBatchError ??
          `Failed to generate challenges ${batch.startOrder}-${batch.startOrder + batch.count - 1}`,
      };
    }

    mergedChallenges.push(...batchBlueprint.challenges);
  }

  const blueprint: StoryChallengesBlueprint = { challenges: mergedChallenges };
  const validation = validateChallengesBlueprint(blueprint, context);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return { success: true, blueprint };
}

export async function runStoryContentAgent(params: {
  storyId: string;
  agentJobId: string;
}): Promise<void> {
  const { storyId, agentJobId } = params;
  const startedAt = Date.now();

  const latestJob = await prisma.agentJob.findFirst({
    where: { storyId, agentType: AgentType.STORY },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (latestJob?.id !== agentJobId) {
    return;
  }

  const context = await collectStoryContext(storyId);
  if (!context) {
    throw new Error(`Story ${storyId} not found`);
  }

  let inputSnapshot: object;
  try {
    inputSnapshot = buildStoryContentInputSnapshot(context);
  } catch (error) {
    console.error("Error building input snapshot:", error);
    inputSnapshot = { error: "Failed to build input snapshot", contextError: String(error) };
  }
  let chaptersBlueprint: StoryChaptersBlueprint | null = null;
  let lastChaptersError: string | undefined;

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt += 1) {
    try {
      const rawResult = await generateChaptersWithLlm(context, lastChaptersError);
      if (!rawResult) {
        lastChaptersError = "LLM returned no result";
        continue;
      }
      const candidate = normalizeChaptersBlueprint(rawResult);
      if (!candidate?.chapters) {
        lastChaptersError = "Normalized blueprint has no chapters";
        continue;
      }
      const validation = validateChaptersBlueprint(candidate, context);
      if (!validation.valid) {
        // Ensure validation.error is a string
        lastChaptersError = typeof validation.error === 'string' ? validation.error : "Validation failed";
        continue;
      }
      chaptersBlueprint = candidate;
      break;
    } catch (error) {
      const formattedError = formatStoryLlmError(error);
      lastChaptersError = typeof formattedError === 'string' ? formattedError : "Unknown LLM error";
    }
  }

  if (!chaptersBlueprint) {
    const errorMessage = "Story content agent failed to produce valid chapters";

    try {
      // Log context for debugging
      console.log("Context properties:", {
        hasChild: !!context.child,
        hasReadingPlan: !!context.readingPlan,
        hasStoryArc: !!context.storyArc,
        childId: context.child?.id,
        readingPlanId: context.readingPlan?.id,
        storyArcId: context.storyArc?.id,
        lastChaptersError: String(lastChaptersError || "none"),
      });

      await markStoryContentFailed({
        agentJobId,
        storyId,
        childId: context.child.id,
        readingPlanId: context.readingPlan?.id ?? null,
        storyArcId: context.storyArc?.id ?? null,
        inputSnapshot,
        errorMessage,
        startedAt,
        outputSnapshot: { validationError: errorMessage, lastError: String(lastChaptersError || "none") },
      });
    } catch (markError) {
      console.error("Failed to mark story content as failed:", markError);
    }

    throw new Error(errorMessage);
  }

  let challengesBlueprint: StoryChallengesBlueprint | null = null;
  let lastChallengesError: string | undefined;

  const challengeGeneration = await generateAllChallengesWithLlm(
    context,
    chaptersBlueprint,
  );

  if (challengeGeneration.success) {
    challengesBlueprint = challengeGeneration.blueprint;
  } else {
    lastChallengesError = challengeGeneration.error;
  }

  if (!challengesBlueprint) {
    const errorMessage =
      lastChallengesError ??
      "Story content agent failed to produce valid challenges";

    await markStoryContentFailed({
      agentJobId,
      storyId,
      childId: context.child.id,
      readingPlanId: context.readingPlan?.id ?? null,
      storyArcId: context.storyArc?.id ?? null,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: { chapters: chaptersBlueprint, validationError: errorMessage },
    });

    throw new Error(errorMessage);
  }

  const chaptersPrompt = buildChaptersUserPrompt(context);
  const challengesPrompt = buildChallengesUserPrompt(
    context,
    chaptersBlueprint.chapters,
  );

  let persistResult;
  try {
    persistResult = await persistStoryContent(
      context,
      chaptersBlueprint,
      challengesBlueprint,
      chaptersPrompt,
      challengesPrompt,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to persist story content";

    await markStoryContentFailed({
      agentJobId,
      storyId,
      childId: context.child.id,
      readingPlanId: context.readingPlan?.id ?? null,
      storyArcId: context.storyArc?.id ?? null,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: {
        chapters: chaptersBlueprint,
        challenges: challengesBlueprint,
        persistError: errorMessage,
      },
    });

    throw new Error(errorMessage);
  }

  await prisma.$transaction([
    prisma.agentJob.update({
      where: { id: agentJobId },
      data: {
        status: AgentJobStatus.SUCCEEDED,
        attemptCount: { increment: 1 },
        completedAt: new Date(),
        inputSnapshot,
        outputSnapshot: {
          chapterIds: persistResult.chapterIds,
          challengeIds: persistResult.challengeIds,
          challengeTypes: challengesBlueprint.challenges.map((c) => c.type),
        },
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.STORY,
        trigger: AgentTrigger.MANUAL_REGENERATION,
        childId: context.child.id,
        readingPlanId: context.readingPlan?.id ?? null,
        storyArcId: context.storyArc?.id ?? null,
        storyId,
        inputSnapshot,
        outputSnapshot: {
          chapterIds: persistResult.chapterIds,
          challengeIds: persistResult.challengeIds,
          challengeTypes: challengesBlueprint.challenges.map((c) => c.type),
        },
        readingLevelBefore: context.child.readingLevel,
        readingLevelAfter: context.child.readingLevel,
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);

  const ttsResult = await enqueueStoryTts({
    storyId,
    childId: context.child.id,
    parentAgentJobId: agentJobId,
  });

  if (!ttsResult.success) {
    console.error("Failed to enqueue story TTS:", ttsResult.error);
  }

  try {
    await sendParentStoryGeneratedEmail(storyId);
  } catch (error) {
    console.error("Failed to send story email notification:", error);
  }
}
