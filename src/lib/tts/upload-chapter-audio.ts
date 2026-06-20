import "server-only";

import { uploadStoryWav } from "./upload-tts-audio";

export async function uploadChapterWav(params: {
  storyId: string;
  chapterId: string;
  order: number;
  wavBuffer: Buffer;
}): Promise<string> {
  return uploadStoryWav({
    filename: `${params.storyId}-ch${params.order}.wav`,
    wavBuffer: params.wavBuffer,
  });
}
