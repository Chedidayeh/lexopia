import "server-only";

import { GoogleGenAI } from "@google/genai";
import { TTSLanguageCodes } from "@/src/types/types";
export interface TTSOptions {
  languageCode?: TTSLanguageCodes;
  prompt?: string;
}

const prompts = {
  [TTSLanguageCodes.ENGLISH_US]:
    "Narrate this story in english clearly and emotionally like an audiobook narrator.",
  [TTSLanguageCodes.ARABIC]:
    "قم بسرد هذه القصة بالعربية بطريقة مشوقة وواضحة، كما لو كنت ترويها ككتاب صوتي.",
  [TTSLanguageCodes.FRENCH]:
    "Racontez cette histoire en français clairement et émotionnellement comme un narrateur de livre audio.",
};

export class VertexAITTSProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_PROJECT_ID,
      location: "us-central1",
      googleAuthOptions: {
        credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY as string),
      },
    });
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<Buffer> {
    const {
      languageCode = TTSLanguageCodes.ENGLISH_US,
      prompt = prompts[languageCode] || prompts[TTSLanguageCodes.ENGLISH_US],
    } = options;

    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: `${prompt}\n\n${text}`,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          languageCode,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Achernar",
            },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData,
    );

    if (!audioPart?.inlineData?.data) {
      console.error(
        "No audio found. Response candidates:",
        response.candidates?.length,
      );
      console.error(
        "First part:",
        response.candidates?.[0]?.content?.parts?.[0],
      );
      throw new Error("No audio returned from Gemini TTS");
    }

    const pcmBuffer = Buffer.from(audioPart.inlineData.data, "base64");
    const wavBuffer = this.wrapPCMInWAV(pcmBuffer, 24000, 1, 16);

    return wavBuffer;
  }

  // Wrap raw PCM data in WAV container with proper headers
  wrapPCMInWAV(
    pcmBuffer: Buffer,
    sampleRate: number = 24000,
    channels: number = 1,
    bitsPerSample: number = 16,
  ): Buffer {
    const byteRate = (sampleRate * channels * bitsPerSample) / 8;
    const blockAlign = (channels * bitsPerSample) / 8;
    const subChunk2Size = pcmBuffer.length;
    const chunkSize = 36 + subChunk2Size;

    const wav = Buffer.alloc(44 + subChunk2Size);

    // RIFF chunk descriptor
    wav.write("RIFF", 0);
    wav.writeUInt32LE(chunkSize, 4);
    wav.write("WAVE", 8);

    // fmt subchunk
    wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16); // subChunk1Size
    wav.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    wav.writeUInt16LE(channels, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(byteRate, 28);
    wav.writeUInt16LE(blockAlign, 32);
    wav.writeUInt16LE(bitsPerSample, 34);

    // data subchunk
    wav.write("data", 36);
    wav.writeUInt32LE(subChunk2Size, 40);
    pcmBuffer.copy(wav, 44);

    return wav;
  }
}
