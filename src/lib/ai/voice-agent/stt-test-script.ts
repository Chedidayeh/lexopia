import fs from "fs";
import path from "path";
import {
  GoogleCloudSTTProvider,
  TTSToSTTLanguageMap,
} from "./stt-provider";
import { TTSLanguageCodes } from "@/src/types/types";

function extractPcmFromWav(wavBuffer: Buffer): {
  pcm: Buffer;
  sampleRate: number;
  channels: number;
} {
  if (wavBuffer.length < 44 || wavBuffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Expected a valid WAV file (RIFF header not found)");
  }

  const sampleRate = wavBuffer.readUInt32LE(24);
  const channels = wavBuffer.readUInt16LE(22);
  const bitsPerSample = wavBuffer.readUInt16LE(34);

  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV bit depth: ${bitsPerSample} (expected 16)`);
  }

  const dataOffset = wavBuffer.indexOf("data");
  if (dataOffset === -1) {
    throw new Error("WAV file missing data chunk");
  }

  const pcmStart = dataOffset + 8;
  const pcm = wavBuffer.subarray(pcmStart);

  return { pcm, sampleRate, channels };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRecognize(
  stt: GoogleCloudSTTProvider,
  pcm: Buffer,
  sampleRate: number,
  languageCode: string,
) {
  console.log("\n--- One-shot recognize() ---");
  const transcript = await stt.recognize(pcm, {
    languageCode,
    sampleRateHertz: sampleRate,
    encoding: "LINEAR16",
  });
  console.log("Transcript:", transcript || "(empty)");
}

async function testStreaming(
  stt: GoogleCloudSTTProvider,
  pcm: Buffer,
  sampleRate: number,
  languageCode: string,
) {
  console.log("\n--- Streaming createStreamingSession() ---");

  const bytesPerSample = 2;
  const chunkDurationMs = 100;
  const chunkSize = Math.floor(
    (sampleRate * bytesPerSample * chunkDurationMs) / 1000,
  );

  const transcripts: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const session = stt.createStreamingSession(
      {
        languageCode,
        sampleRateHertz: sampleRate,
        encoding: "LINEAR16",
        interimResults: true,
      },
      (result) => {
        const label = result.isFinal ? "FINAL" : "interim";
        console.log(`[${label}] ${result.transcript}`);
        if (result.isFinal) {
          transcripts.push(result.transcript);
        }
      },
      (error) => reject(error),
    );

    (async () => {
      try {
        for (let offset = 0; offset < pcm.length; offset += chunkSize) {
          session.write(pcm.subarray(offset, offset + chunkSize));
          await sleep(chunkDurationMs);
        }
        session.end();
        await sleep(500);
        resolve();
      } catch (err) {
        session.destroy();
        reject(err);
      }
    })();
  });

  console.log(
    "Combined final transcript:",
    transcripts.join(" ").trim() || "(empty)",
  );
}

async function run() {
  const audioPathArg = process.argv[2];
  const languageArg = process.argv[3];

  let audioPath = audioPathArg;
  if (!audioPath) {
    const outDir = path.resolve(process.cwd(), "output");
    if (fs.existsSync(outDir)) {
      const wavFiles = fs
        .readdirSync(outDir)
        .filter((f) => f.endsWith(".wav"))
        .map((f) => path.join(outDir, f))
        .sort(
          (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
        );
      audioPath = wavFiles[0];
    }
  }

  if (!audioPath) {
    console.error(
      "Usage: npx ts-node src/agents/voice-agent/stt-test-script.ts [path-to.wav] [languageCode]",
    );
    console.error(
      "Example: npx ts-node src/agents/voice-agent/stt-test-script.ts output/story-2026.wav ar-SA",
    );
    console.error(
      "Tip: run test-script.ts first to generate a WAV, then run this script.",
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(audioPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Audio file not found: ${resolvedPath}`);
  }

  const languageCode =
    languageArg ?? TTSToSTTLanguageMap[TTSLanguageCodes.ENGLISH_US];

  console.log("Reading:", resolvedPath);
  console.log("Language:", languageCode);

  const wavBuffer = fs.readFileSync(resolvedPath);
  const { pcm, sampleRate, channels } = extractPcmFromWav(wavBuffer);

  console.log("Audio:", {
    pcmBytes: pcm.length,
    sampleRate,
    channels,
    durationSec: (pcm.length / (sampleRate * channels * 2)).toFixed(2),
  });

  const stt = new GoogleCloudSTTProvider();

  await testRecognize(stt, pcm, sampleRate, languageCode);
  await testStreaming(stt, pcm, sampleRate, languageCode);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
