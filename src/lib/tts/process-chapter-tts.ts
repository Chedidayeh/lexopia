import "server-only";

import { VertexAITTSProvider } from "@/src/lib/ai/voice-agent/tts-provider";
import type { TtsChapterContext, TtsStoryContext } from "./types";
import { toTtsLanguageCode } from "./language-map";
import { persistChapterAudio } from "./persist-chapter-audio";
import { uploadChapterWav } from "./upload-chapter-audio";

const CHAPTER_TTS_DELAY_MS = 300;

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

export async function synthesizeAndPersistChapter(params: {
  context: TtsStoryContext;
  chapter: TtsChapterContext;
}): Promise<{ chapterId: string; audioUrl: string; skipped: boolean }> {
  const { context, chapter } = params;

  if (chapter.audioUrl?.trim() && chapter.hasTtsAudio) {
    return {
      chapterId: chapter.id,
      audioUrl: chapter.audioUrl,
      skipped: true,
    };
  }

  const wavBuffer = await getTtsProvider().synthesize(chapter.content, {
    languageCode: toTtsLanguageCode(context.primaryLanguage),
  });

  const audioUrl = await uploadChapterWav({
    storyId: context.story.id,
    chapterId: chapter.id,
    order: chapter.order,
    wavBuffer,
  });

  await persistChapterAudio({
    storyId: context.story.id,
    chapterId: chapter.id,
    languageCode: context.primaryLanguage,
    audioUrl,
    sizeBytes: wavBuffer.length,
  });

  await delay(CHAPTER_TTS_DELAY_MS);

  return { chapterId: chapter.id, audioUrl, skipped: false };
}
