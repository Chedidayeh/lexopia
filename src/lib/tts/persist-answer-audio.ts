import "server-only";

import type { LanguageCode } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { answerTtsPrompt } from "./challenge-tts-helpers";
import { TTS_VOICE_NAME } from "./language-map";

export async function persistAnswerAudio(params: {
  storyId: string;
  challengeId: string;
  answerId: string;
  languageCode: LanguageCode;
  audioUrl: string;
  sizeBytes: number;
}): Promise<void> {
  const { storyId, challengeId, answerId, languageCode, audioUrl, sizeBytes } =
    params;

  await prisma.$transaction([
    prisma.answer.update({
      where: { id: answerId },
      data: { audioUrl },
    }),
    prisma.tTSAudio.create({
      data: {
        storyId,
        challengeId,
        languageCode,
        voice: TTS_VOICE_NAME,
        prompt: answerTtsPrompt(answerId),
        audioUrl,
        mimeType: "audio/wav",
        sizeBytes,
      },
    }),
  ]);
}
