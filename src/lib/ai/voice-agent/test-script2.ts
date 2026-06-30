import "dotenv/config";
import fs from "fs";
import path from "path";
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

class VertexAITTSProvider {
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

    wav.write("RIFF", 0);
    wav.writeUInt32LE(chunkSize, 4);
    wav.write("WAVE", 8);

    wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(channels, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(byteRate, 28);
    wav.writeUInt16LE(blockAlign, 32);
    wav.writeUInt16LE(bitsPerSample, 34);

    wav.write("data", 36);
    wav.writeUInt32LE(subChunk2Size, 40);
    pcmBuffer.copy(wav, 44);

    return wav;
  }
}

async function run() {
  const tts = new VertexAITTSProvider();

  const welcomeText = `Understanding Reading Challenges.
We're here to help with common reading difficulties.

Let's start with reading difficulties. This includes slow, effortful reading, trouble recognizing common words quickly, and skipping or misreading words in sentences.

Next, many children experience spelling problems. This shows up as inconsistent spelling where the same word is spelled differently each time, difficulty remembering how words are written, and mixing up letters like "b" and "d".

Another common challenge is sound-letter confusion. Children may have trouble matching letters to their sounds, difficulty breaking words into syllables or sounds, and problems blending sounds to form words.

Additionally, memory and processing issues can affect learning. This includes difficulty remembering instructions or sequences, and needing more time to process language.

Finally, there's often an emotional impact. This can include frustration or avoidance of reading tasks, low confidence in school settings, and feeling "slower" than classmates even when they're not.

Our app is designed to address these challenges and help your child succeed`;

  const audio = await tts.synthesize(welcomeText, {
    languageCode: TTSLanguageCodes.ENGLISH_US,
    prompt: "You are a warm, empathetic guide for parents of children with reading difficulties. Speak with a reassuring, encouraging, and professional tone. Use clear articulation and moderate pacing - not too fast, allowing listeners to absorb each point. Add brief natural pauses between sections. Convey hope and confidence that this app will help their child succeed. Be inviting and make parents feel supported and understood.",
  });

  const outDir = path.resolve(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `welcome-${timestamp}.wav`;
  const filePath = path.join(outDir, filename);

  if (audio.length === 0) {
    throw new Error("Audio buffer is empty!");
  }

  fs.writeFileSync(filePath, audio); // Gemini returns raw PCM (now wrapped in WAV container)
  console.log("Wrote audio to:", filePath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
