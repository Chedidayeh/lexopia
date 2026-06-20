import { AgentTrigger } from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";
import { runChildOrchestration } from "@/src/lib/orchestration/run-child-orchestration";
import { prisma } from "@/src/lib/prisma";

export const childOrchestratorFunction = inngest.createFunction(
  {
    id: "child-orchestrator",
    retries: 2,
    triggers: [{ event: INNGEST_EVENTS.ORCHESTRATION_CHILD_REQUESTED }],
  },
  async ({ event }) => {
    const { childId, trigger } = event.data as {
      childId: string;
      trigger: AgentTrigger;
    };

    const result = await runChildOrchestration(childId, trigger);
    return result;
  },
);

export const weeklyOrchestratorCronFunction = inngest.createFunction(
  {
    id: "weekly-orchestrator-cron",
    triggers: [{ cron: "0 6 * * 0" }],
  },
  async ({ step }) => {
    const eligibleChildren = await step.run("fetch-eligible-children", () =>
      prisma.child.findMany({
        where: {
          onboardingCompletedAt: { not: null },
          interests: { isEmpty: false },
        },
        select: { id: true },
      }),
    );

    if (eligibleChildren.length === 0) {
      return { dispatched: 0 };
    }

    await step.sendEvent(
      "dispatch-child-orchestration",
      eligibleChildren.map((child) => ({
        name: INNGEST_EVENTS.ORCHESTRATION_CHILD_REQUESTED,
        data: {
          childId: child.id,
          trigger: AgentTrigger.SCHEDULED_WEEKLY,
        },
      })),
    );

    return { dispatched: eligibleChildren.length };
  },
);
