import { AgentJobStatus } from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { runPlanningAgent } from "@/src/lib/reading-plan/run-planning-agent";
import { prisma } from "@/src/lib/prisma";

export const planningAgentFunction = inngest.createFunction(
  {
    id: "reading-plan-planning-agent",
    retries: 2,
    triggers: [{ event: INNGEST_EVENTS.PLANNING_REQUESTED }],
  },
  async ({ event, runId }) => {
    const { readingPlanId, agentJobId } = event.data as {
      readingPlanId: string;
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
      await runPlanningAgent({ readingPlanId, agentJobId });
      return { success: true, readingPlanId, agentJobId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Planning agent failed";

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
