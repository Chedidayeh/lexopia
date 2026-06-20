import type { TtsChapterContext } from "./types";

export function shouldSynthesizeChapter(chapter: TtsChapterContext): boolean {
  return !(chapter.audioUrl?.trim() && chapter.hasTtsAudio);
}

export function countChaptersNeedingTts(chapters: TtsChapterContext[]): number {
  return chapters.filter(shouldSynthesizeChapter).length;
}
