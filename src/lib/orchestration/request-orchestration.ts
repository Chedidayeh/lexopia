import "server-only";

import type { AgentTrigger } from "@prisma/client";
import { inngest } from "@/src/lib/inngest/client";
import { INNGEST_EVENTS } from "@/src/lib/inngest/events";

export async function requestChildOrchestration(
  childId: string,
  trigger: AgentTrigger,
): Promise<void> {
  await inngest.send({
    name: INNGEST_EVENTS.ORCHESTRATION_CHILD_REQUESTED,
    data: { childId, trigger },
  });
}
