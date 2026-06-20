import "server-only";

import type { LanguageCode } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { TTS_VOICE_NAME } from "./language-map";

export async function persistChapterAudio(params: {
  storyId: string;
  chapterId: string;
  languageCode: LanguageCode;
  audioUrl: string;
  sizeBytes: number;
}): Promise<void> {
  const { storyId, chapterId, languageCode, audioUrl, sizeBytes } = params;

  await prisma.$transaction([
    prisma.chapter.update({
      where: { id: chapterId },
      data: { audioUrl },
    }),
    prisma.chapterTranslation.updateMany({
      where: { chapterId, languageCode },
      data: { audioUrl },
    }),
    prisma.tTSAudio.create({
      data: {
        storyId,
        chapterId,
        languageCode,
        voice: TTS_VOICE_NAME,
        audioUrl,
        mimeType: "audio/wav",
        sizeBytes,
      },
    }),
  ]);
}
