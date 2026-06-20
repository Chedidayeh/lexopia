import "dotenv/config";
import fs from "fs";
import path from "path";
import { VertexAITTSProvider } from "./tts-provider";
import { TTSLanguageCodes } from "@/src/types/types";

async function run() {
  const tts = new VertexAITTSProvider();

  const audio = await tts.synthesize(
    "The little rabbit hopped through the forest. Along the way, he found a shiny golden key hidden beneath a tree. What do you think the key unlocks?",
    {
      languageCode: TTSLanguageCodes.ENGLISH_US,
      prompt:
        "Read this children's story slowly, clearly, and naturally. Pronounce every word carefully for young readers.",
    }
  );

  const outDir = path.resolve(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `story-${timestamp}.wav`;
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
