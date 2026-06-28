import "server-only";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  AgentJobStatus,
  AgentTrigger,
  AgentType,
  ReadingPlanStatus,
} from "@prisma/client";
import { createLangChainModel } from "@/src/lib/ai/langchain-model";
import { requestChildOrchestration } from "@/src/lib/orchestration/request-orchestration";
import {
  buildPlanningInputSnapshot,
  collectPlanningContext,
} from "./collect-planning-context";
import {
  buildPlanningSystemPrompt,
  buildPlanningUserPrompt,
} from "./planning-prompt";
import {
  planBlueprintSchema,
  validateBlueprintAgainstPlan,
  validateChallengeCoveragePossible,
  type PlanBlueprint,
} from "./plan-blueprint.schema";
import { persistPlanScaffold } from "./persist-plan-scaffold";
import { prisma } from "@/src/lib/prisma";
import { sendParentReadingPlanGeneratedEmail } from "@/src/lib/notifications/parent-generation-notifications";

const MAX_LLM_ATTEMPTS = 3;

async function updateChildContentHistory(params: {
  childId: string;
  blueprint: PlanBlueprint;
}): Promise<void> {
  const { childId, blueprint } = params;

  // Extract content from the blueprint
  const usedWorlds: string[] = [];
  const usedCharacters: string[] = [];
  const usedStoryArcs: string[] = [];

  for (const roadmap of blueprint.roadmaps) {
    for (const world of roadmap.worlds) {
      usedWorlds.push(world.name);
      usedStoryArcs.push(world.storyArc.title);
      
      // Extract characters from continuity bible
      const continuityBible = world.storyArc.continuityBible as Record<string, any> || {};
      const characters = continuityBible.characters || [];
      for (const char of characters) {
        if (char.name) {
          usedCharacters.push(char.name);
        }
      }
    }
  }

  // Get current content history
  const child = await prisma.child.findUnique({
    where: { id: childId },
  });

  if (!child) return;

  const childWithHistory = child as typeof child & { contentHistory?: Record<string, any> };
  const currentHistory = childWithHistory.contentHistory || {};
  const currentUsedWorlds = currentHistory.usedWorlds || [];
  const currentUsedCharacters = currentHistory.usedCharacters || [];
  const currentUsedStoryArcs = currentHistory.usedStoryArcs || [];
  const currentCompletedInterests = currentHistory.completedInterests || [];

  // Merge with new content, avoiding duplicates
  const updatedHistory = {
    usedWorlds: [...new Set([...currentUsedWorlds, ...usedWorlds])],
    usedCharacters: [...new Set([...currentUsedCharacters, ...usedCharacters])],
    usedStoryArcs: [...new Set([...currentUsedStoryArcs, ...usedStoryArcs])],
    completedInterests: currentCompletedInterests,
    lastPlanGeneration: new Date().toISOString(),
  };

  await prisma.child.update({
    where: { id: childId },
    data: { contentHistory: updatedHistory as any },
  });
}

async function markPlanningFailed(params: {
  agentJobId: string;
  readingPlanId: string;
  childId: string;
  inputSnapshot: object;
  errorMessage: string;
  startedAt: number;
  outputSnapshot?: object;
}) {
  const {
    agentJobId,
    readingPlanId,
    childId,
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
    prisma.readingPlan.update({
      where: { id: readingPlanId },
      data: {
        status: ReadingPlanStatus.FAILED,
        generationError: errorMessage,
        generationCompletedAt: new Date(),
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.PLANNING,
        trigger: "MANUAL_REGENERATION",
        childId,
        readingPlanId,
        inputSnapshot,
        outputSnapshot: outputSnapshot ?? { error: errorMessage },
        error: errorMessage,
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);
}

async function generateBlueprintWithLlm(
  context: NonNullable<Awaited<ReturnType<typeof collectPlanningContext>>>,
  validationFeedback?: string,
): Promise<PlanBlueprint> {
  const model = createLangChainModel(0.2).withStructuredOutput(planBlueprintSchema);

  const messages = [
    new SystemMessage(buildPlanningSystemPrompt()),
    new HumanMessage(
      validationFeedback
        ? `${buildPlanningUserPrompt(context)}\n\nPrevious attempt failed validation:\n${validationFeedback}\n\nReturn a corrected blueprint.`
        : buildPlanningUserPrompt(context),
    ),
  ];

  return model.invoke(messages);
}

export async function runPlanningAgent(params: {
  readingPlanId: string;
  agentJobId: string;
}): Promise<void> {
  const { readingPlanId, agentJobId } = params;
  const startedAt = Date.now();

  const context = await collectPlanningContext(readingPlanId);
  if (!context) {
    throw new Error(`ReadingPlan ${readingPlanId} not found`);
  }

  const inputSnapshot = buildPlanningInputSnapshot(context);

  const coverageCheck = validateChallengeCoveragePossible({
    sourceInterests: context.readingPlan.sourceInterests,
    worldsPerRoadmapMin: context.readingPlan.worldsPerRoadmapMin,
    worldsPerRoadmapMax: context.readingPlan.worldsPerRoadmapMax,
    storiesPerWorld: context.readingPlan.storiesPerWorld,
    assignedChallenges: context.readingPlan.assignedChallenges,
    challengesPerStory: context.sizing.challengesPerStory,
  });

  if (!coverageCheck.valid) {
    const errorMessage = coverageCheck.error;

    await markPlanningFailed({
      agentJobId,
      readingPlanId,
      childId: context.child.id,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: { validationError: errorMessage },
    });

    throw new Error(errorMessage);
  }

  let lastValidationError: string | undefined;
  let blueprint: PlanBlueprint | null = null;

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    try {
      const candidate = await generateBlueprintWithLlm(
        context,
        lastValidationError,
      );

      const validation = validateBlueprintAgainstPlan(candidate, {
        sourceInterests: context.readingPlan.sourceInterests,
        worldsPerRoadmapMin: context.readingPlan.worldsPerRoadmapMin,
        worldsPerRoadmapMax: context.readingPlan.worldsPerRoadmapMax,
        storiesPerWorld: context.readingPlan.storiesPerWorld,
        assignedChallenges: context.readingPlan.assignedChallenges,
        challengesPerStory: context.sizing.challengesPerStory,
      });

      if (!validation.valid) {
        lastValidationError = validation.error;
        continue;
      }

      blueprint = candidate;
      break;
    } catch (error) {
      lastValidationError =
        error instanceof Error ? error.message : "LLM invocation failed";
    }
  }

  if (!blueprint) {
    const errorMessage =
      lastValidationError ?? "Planning agent failed to produce a valid blueprint";

    await markPlanningFailed({
      agentJobId,
      readingPlanId,
      childId: context.child.id,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: { validationError: errorMessage },
    });

    throw new Error(errorMessage);
  }

  let persistResult;
  try {
    persistResult = await persistPlanScaffold(context, blueprint);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to persist plan scaffold";

    await markPlanningFailed({
      agentJobId,
      readingPlanId,
      childId: context.child.id,
      inputSnapshot,
      errorMessage,
      startedAt,
      outputSnapshot: { blueprint, persistError: errorMessage },
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
          blueprint,
          firstStoryId: persistResult.firstStoryId,
          totalStories: persistResult.totalStories,
        },
      },
    }),
    prisma.readingPlan.update({
      where: { id: readingPlanId },
      data: {
        aiPromptSnapshot: buildPlanningUserPrompt(context),
      },
    }),
    prisma.aiGenerationLog.create({
      data: {
        agentJobId,
        agentType: AgentType.PLANNING,
        trigger: "MANUAL_REGENERATION",
        childId: context.child.id,
        readingPlanId,
        inputSnapshot,
        outputSnapshot: {
          blueprint,
          firstStoryId: persistResult.firstStoryId,
          totalStories: persistResult.totalStories,
        },
        readingLevelBefore: context.child.readingLevel,
        readingLevelAfter: context.child.readingLevel,
        durationMs: Date.now() - startedAt,
      },
    }),
  ]);

  // Update child's content history with new content from this plan
  await updateChildContentHistory({
    childId: context.child.id,
    blueprint,
  });

  try {
    await requestChildOrchestration(
      context.child.id,
      AgentTrigger.STORY_UNLOCK,
    );
  } catch (error) {
    console.error("Failed to request post-planning orchestration:", error);
  }

  try {
    await sendParentReadingPlanGeneratedEmail(readingPlanId);
  } catch (error) {
    console.error("Failed to send reading plan email notification:", error);
  }
}
