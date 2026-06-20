import { AgentJobStatus } from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { runStoryContentAgent } from "@/src/lib/story-content/run-story-content-agent";
import { prisma } from "@/src/lib/prisma";

export const storyContentAgentFunction = inngest.createFunction(
  {
    id: "story-content-agent",
    retries: 2,
    triggers: [{ event: INNGEST_EVENTS.STORY_CONTENT_REQUESTED }],
  },
  async ({ event, runId }) => {
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
      await runStoryContentAgent({ storyId, agentJobId });
      return { success: true, storyId, agentJobId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Story content agent failed";

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
