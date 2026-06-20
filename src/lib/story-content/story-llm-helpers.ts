const CHAPTER_EXCERPT_MAX_WORDS = 80;

export function condenseChapterForChallengesPrompt(
  content: string,
  maxWords = CHAPTER_EXCERPT_MAX_WORDS,
): string {
  const words = content.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  const headCount = Math.ceil(maxWords / 2);
  const tailCount = maxWords - headCount;

  return `${words.slice(0, headCount).join(" ")} ... ${words.slice(-tailCount).join(" ")}`;
}

export function formatStoryLlmError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "LLM invocation failed";

  if (
    message.includes("Unterminated string") ||
    message.includes("OUTPUT_PARSING_FAILURE") ||
    message.includes("Failed to parse")
  ) {
    return `${message}. The model returned truncated or invalid JSON — keep hints under 15 words, keep sentenceTemplate under one short sentence, never repeat text in a loop, and return complete valid JSON.`;
  }

  return message;
}

/** Detects runaway repetition loops in LLM strings (e.g. "a_ve_a_ve_a_ve..."). */
export function hasRepetitiveTextGarbage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 500) {
    return true;
  }

  return /(.{2,12})\1{6,}/.test(trimmed);
}

export function findRepetitiveFieldInChallenge(challenge: {
  question: string;
  targetWord?: string | null;
  sentenceTemplate?: string | null;
  hints?: string[];
  answers?: { text: string; letterValue?: string | null }[];
}): string | null {
  const fields: [string, string | null | undefined][] = [
    ["question", challenge.question],
    ["targetWord", challenge.targetWord],
    ["sentenceTemplate", challenge.sentenceTemplate],
    ...(challenge.hints ?? []).map(
      (hint, index) => [`hint ${index + 1}`, hint] as [string, string],
    ),
    ...(challenge.answers ?? []).flatMap((answer, index) => [
      [`answer ${index + 1} text`, answer.text] as [string, string],
      [`answer ${index + 1} letterValue`, answer.letterValue] as [
        string,
        string | null | undefined,
      ],
    ]),
  ];

  for (const [name, value] of fields) {
    if (value && hasRepetitiveTextGarbage(value)) {
      return name;
    }
  }

  return null;
}

export function getChallengeBatchSize(challengeCount: number): number {
  if (challengeCount <= 3) {
    return challengeCount;
  }

  return 2;
}

export function splitChallengeBatches(
  challengeCount: number,
  batchSize: number,
): { startIndex: number; count: number; startOrder: number }[] {
  const batches: { startIndex: number; count: number; startOrder: number }[] =
    [];

  for (let index = 0; index < challengeCount; index += batchSize) {
    batches.push({
      startIndex: index,
      count: Math.min(batchSize, challengeCount - index),
      startOrder: index + 1,
    });
  }

  return batches;
}
