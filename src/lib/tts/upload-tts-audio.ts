import "server-only";

import { UTApi } from "uploadthing/server";

const UPLOAD_MAX_ATTEMPTS = 4;
const UPLOAD_RETRY_BASE_MS = 2000;

const utapi = new UTApi();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableUploadFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("transport") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to upload") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("network")
  );
}

async function uploadStoryWavOnce(params: {
  filename: string;
  wavBuffer: Buffer;
}): Promise<string> {
  const file = new File(
    [new Uint8Array(params.wavBuffer)],
    params.filename,
    { type: "audio/wav" },
  );

  const result = await utapi.uploadFiles(file);

  if (result.error || !result.data?.url) {
    throw new Error(
      result.error?.message ?? "Uploadthing failed to upload TTS audio",
    );
  }

  return result.data.url;
}

export async function uploadStoryWav(params: {
  filename: string;
  wavBuffer: Buffer;
}): Promise<string> {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN is required for TTS audio uploads");
  }

  const sizeMb = (params.wavBuffer.length / (1024 * 1024)).toFixed(2);
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await uploadStoryWavOnce(params);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Uploadthing upload failed";
      lastError = new Error(
        `Upload failed for ${params.filename} (${sizeMb} MB, attempt ${attempt}/${UPLOAD_MAX_ATTEMPTS}): ${message}`,
      );

      const canRetry =
        attempt < UPLOAD_MAX_ATTEMPTS && isRetryableUploadFailure(message);

      if (!canRetry) {
        throw lastError;
      }

      await delay(UPLOAD_RETRY_BASE_MS * attempt);
    }
  }

  throw lastError ?? new Error(`Upload failed for ${params.filename}`);
}
