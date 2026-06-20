import { serve } from "inngest/next";
import { inngest } from "@/src/lib/inngest/client";
import {
  childOrchestratorFunction,
  weeklyOrchestratorCronFunction,
} from "@/src/lib/inngest/functions/orchestrator";
import { planningAgentFunction } from "@/src/lib/inngest/functions/planning-agent";
import { storyContentAgentFunction } from "@/src/lib/inngest/functions/story-content-agent";
import { ttsAgentFunction } from "@/src/lib/inngest/functions/tts-agent";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    planningAgentFunction,
    storyContentAgentFunction,
    ttsAgentFunction,
    weeklyOrchestratorCronFunction,
    childOrchestratorFunction,
  ],
});
