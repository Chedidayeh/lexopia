import { SpeechClient, protos } from "@google-cloud/speech";
import { TTSLanguageCodes } from "@/src/types/types";

export interface STTOptions {
  languageCode?: string;
  sampleRateHertz?: number;
  encoding?: "LINEAR16" | "WEBM_OPUS";
  interimResults?: boolean;
}

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface STTStreamingSession {
  write: (audioChunk: Buffer) => void;
  end: () => void;
  destroy: () => void;
}

/** Maps TTS BCP-47 tags to Google Speech-to-Text language codes. */
export const TTSToSTTLanguageMap: Record<TTSLanguageCodes, string> = {
  [TTSLanguageCodes.ENGLISH_US]: "en-US",
  [TTSLanguageCodes.ARABIC]: "ar-SA",
  [TTSLanguageCodes.FRENCH]: "fr-FR",
};

export class GoogleCloudSTTProvider {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY as string),
    });
  }

  /**
   * One-shot transcription for a complete audio buffer (useful for tests / uploads).
   */
  async recognize(audioBuffer: Buffer, options: STTOptions = {}): Promise<string> {
    const {
      languageCode = TTSToSTTLanguageMap[TTSLanguageCodes.ENGLISH_US],
      sampleRateHertz = 16000,
      encoding = "LINEAR16",
    } = options;

    const [response] = await this.client.recognize({
      config: {
        encoding,
        sampleRateHertz,
        languageCode,
        enableAutomaticPunctuation: true,
      },
      audio: { content: audioBuffer.toString("base64") },
    });

    return (
      response.results
        ?.map(
          (result: { alternatives?: Array<{ transcript?: string | null }> | null }) =>
            result.alternatives?.[0]?.transcript ?? "",
        )
        .join(" ")
        .trim() ?? ""
    );
  }

  /**
   * Opens a bidirectional streaming session for real-time transcription.
   * Push PCM/WebM chunks via `write()`; receive interim + final transcripts via `onResult`.
   */
  createStreamingSession(
    options: STTOptions,
    onResult: (result: STTResult) => void,
    onError: (error: Error) => void,
  ): STTStreamingSession {
    const {
      languageCode = TTSToSTTLanguageMap[TTSLanguageCodes.ENGLISH_US],
      sampleRateHertz = 16000,
      encoding = "LINEAR16",
      interimResults = true,
    } = options;

    const recognizeStream = this.client
      .streamingRecognize({
        config: {
          encoding,
          sampleRateHertz,
          languageCode,
          enableAutomaticPunctuation: true,
        },
        interimResults,
      })
      .on("error", (err: Error) => onError(err))
      .on("data", (data: protos.google.cloud.speech.v1.IStreamingRecognizeResponse) => {
        const result = data.results?.[0];
        const alternative = result?.alternatives?.[0];
        if (!result || !alternative?.transcript) return;

        onResult({
          transcript: alternative.transcript,
          isFinal: Boolean(result.isFinal),
          confidence: alternative.confidence ?? undefined,
        });
      });

    return {
      write: (audioChunk: Buffer) => {
        if (audioChunk.length > 0) {
          recognizeStream.write(audioChunk);
        }
      },
      end: () => recognizeStream.end(),
      destroy: () => recognizeStream.destroy(),
    };
  }
}
