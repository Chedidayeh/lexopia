import "server-only";

import { VertexAITTSProvider } from "@/src/lib/ai/voice-agent/tts-provider";
import type { TtsChallengeContext, TtsStoryContext } from "./types";
import { buildSoundMatchAnswerTtsPrompt } from "./challenge-tts-scripts";
import { shouldSynthesizeTarget } from "./challenge-tts-helpers";
import type { TtsTarget } from "./challenge-tts-targets";
import { toTtsLanguageCode } from "./language-map";
import { persistAnswerAudio } from "./persist-answer-audio";
import { persistChallengeAudio } from "./persist-challenge-audio";
import { uploadStoryWav } from "./upload-tts-audio";

const TTS_DELAY_MS = 300;

let ttsProvider: VertexAITTSProvider | null = null;

function getTtsProvider(): VertexAITTSProvider {
  if (!ttsProvider) {
    ttsProvider = new VertexAITTSProvider();
  }
  return ttsProvider;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildUploadFilename(
  storyId: string,
  target: TtsTarget,
): string {
  if (target.kind === "challenge-question") {
    return `${storyId}-challenge-${target.order}-question.wav`;
  }

  return `${storyId}-challenge-${target.order}-answer-${target.order}.wav`;
}

export type ChallengeTtsStepResult = {
  targetKind: TtsTarget["kind"];
  challengeId: string;
  answerId?: string;
  audioUrl: string;
  skipped: boolean;
};

export async function synthesizeAndPersistChallengeTarget(params: {
  context: TtsStoryContext;
  challenge: TtsChallengeContext;
  target: TtsTarget;
}): Promise<ChallengeTtsStepResult> {
  const { context, challenge, target } = params;

  if (!shouldSynthesizeTarget(target, challenge)) {
    if (target.kind === "challenge-question") {
      return {
        targetKind: target.kind,
        challengeId: challenge.id,
        audioUrl: challenge.audioUrl,
        skipped: true,
      };
    }

    const answer = challenge.answers.find((entry) => entry.id === target.answerId);
    return {
      targetKind: target.kind,
      challengeId: challenge.id,
      answerId: target.answerId,
      audioUrl: answer?.audioUrl ?? "",
      skipped: true,
    };
  }

  const synthesisOptions =
    target.kind === "sound-match-answer"
      ? {
          languageCode: toTtsLanguageCode(context.primaryLanguage),
          prompt: buildSoundMatchAnswerTtsPrompt(target.text),
        }
      : {
          languageCode: toTtsLanguageCode(context.primaryLanguage),
        };

  const wavBuffer = await getTtsProvider().synthesize(
    target.text,
    synthesisOptions,
  );

  const audioUrl = await uploadStoryWav({
    filename: buildUploadFilename(context.story.id, target),
    wavBuffer,
  });

  if (target.kind === "challenge-question") {
    await persistChallengeAudio({
      storyId: context.story.id,
      challengeId: challenge.id,
      languageCode: context.primaryLanguage,
      audioUrl,
      sizeBytes: wavBuffer.length,
    });

    await delay(TTS_DELAY_MS);

    return {
      targetKind: target.kind,
      challengeId: challenge.id,
      audioUrl,
      skipped: false,
    };
  }

  await persistAnswerAudio({
    storyId: context.story.id,
    challengeId: challenge.id,
    answerId: target.answerId,
    languageCode: context.primaryLanguage,
    audioUrl,
    sizeBytes: wavBuffer.length,
  });

  await delay(TTS_DELAY_MS);

  return {
    targetKind: target.kind,
    challengeId: challenge.id,
    answerId: target.answerId,
    audioUrl,
    skipped: false,
  };
}
