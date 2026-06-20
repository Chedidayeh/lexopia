import type { ChallengeType } from "@prisma/client";

export type ChallengeScriptInput = {
  type: ChallengeType;
  question: string;
  targetWord?: string | null;
  sentenceTemplate?: string | null;
};

/** Extract quoted reference word from SOUND_MATCH questions, e.g. "...as 'seed'?". */
export function extractSoundMatchReferenceWord(question: string): string | null {
  const patterns = [
    /\bas\s+['"]([^'"]+)['"]/i,
    /\blike\s+['"]([^'"]+)['"]/i,
    /['"]([^'"]+)['"]\s*\?/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

function speakSentenceTemplate(sentenceTemplate: string): string {
  return sentenceTemplate.replace(/___+/g, "blank").trim();
}

export function buildChallengeQuestionScript(
  challenge: ChallengeScriptInput,
): string {
  const question = challenge.question.trim();

  switch (challenge.type) {
    case "FILL_BLANK":
    case "COMPLETE_WORD": {
      const sentence = challenge.sentenceTemplate?.trim();
      if (!sentence) {
        return question;
      }
      return `${question}. ${speakSentenceTemplate(sentence)}`;
    }

    case "SOUND_MATCH": {
      const referenceWord = extractSoundMatchReferenceWord(question);
      return referenceWord ?? question;
    }

    case "READ_ALOUD": {
      const targetWord = challenge.targetWord?.trim();
      if (!targetWord) {
        return question;
      }
      return `${question} ${targetWord}`;
    }

    default:
      return question;
  }
}

export function buildSoundMatchAnswerScript(word: string): string {
  return word.trim();
}

export function buildSoundMatchAnswerTtsPrompt(word: string): string {
  return `Say the word clearly: ${word.trim()}`;
}
