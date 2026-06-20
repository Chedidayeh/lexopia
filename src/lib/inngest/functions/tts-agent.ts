import { AgentJobStatus } from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { runTtsAgent } from "@/src/lib/tts/run-tts-agent";
import { prisma } from "@/src/lib/prisma";

export const ttsAgentFunction = inngest.createFunction(
  {
    id: "tts-agent",
    retries: 2,
    timeouts: { finish: "30m" },
    triggers: [{ event: INNGEST_EVENTS.STORY_TTS_REQUESTED }],
  },
  async ({ event, step, runId }) => {
    const { storyId, agentJobId } = event.data as {
      storyId: string;
      agentJobId: string;
      childId: string;
    };

    await prisma.agentJob.update({
      where: { id: agentJobId },
      data: {
        status: AgentJobStatus.RUNNING,
        startedAt: new Date(),
        inngestRunId: runId,
        inngestEventId: event.id,
        attemptCount: { increment: 1 },
      },
    });

    try {
      await runTtsAgent({
        storyId,
        agentJobId,
        step: {
          run: (name, fn) => step.run(name, fn),
        },
      });
      return { success: true, storyId, agentJobId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "TTS agent failed";

      await prisma.agentJob.update({
        where: { id: agentJobId },
        data: {
          status: AgentJobStatus.FAILED,
          completedAt: new Date(),
          error: message,
        },
      });

      throw error;
    }
  },
);
