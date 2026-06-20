import "server-only";

import type { LanguageCode } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { TTS_VOICE_NAME } from "./language-map";

export async function persistChallengeAudio(params: {
  storyId: string;
  challengeId: string;
  languageCode: LanguageCode;
  audioUrl: string;
  sizeBytes: number;
}): Promise<void> {
  const { storyId, challengeId, languageCode, audioUrl, sizeBytes } = params;

  await prisma.$transaction([
    prisma.challenge.update({
      where: { id: challengeId },
      data: { audioUrl },
    }),
    prisma.challengeTranslation.updateMany({
      where: { challengeId, languageCode },
      data: { audioUrl },
    }),
    prisma.tTSAudio.create({
      data: {
        storyId,
        challengeId,
        languageCode,
        voice: TTS_VOICE_NAME,
        audioUrl,
        mimeType: "audio/wav",
        sizeBytes,
      },
    }),
  ]);
}
