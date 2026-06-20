import type { TtsAnswerContext, TtsChallengeContext } from "./types";
import type { TtsTarget } from "./challenge-tts-targets";

export const ANSWER_TTS_PROMPT_PREFIX = "answer:";

export function answerTtsPrompt(answerId: string): string {
  return `${ANSWER_TTS_PROMPT_PREFIX}${answerId}`;
}

export function isAnswerTtsPrompt(prompt: string | null | undefined): boolean {
  return Boolean(prompt?.startsWith(ANSWER_TTS_PROMPT_PREFIX));
}

export function shouldSynthesizeChallengeQuestion(
  challenge: TtsChallengeContext,
): boolean {
  return !(challenge.audioUrl?.trim() && challenge.hasQuestionTtsAudio);
}

export function shouldSynthesizeSoundMatchAnswer(
  answer: TtsAnswerContext,
): boolean {
  return !(answer.audioUrl?.trim() && answer.hasTtsAudio);
}

export function shouldSynthesizeTarget(
  target: TtsTarget,
  challenge: TtsChallengeContext,
): boolean {
  if (target.kind === "challenge-question") {
    return shouldSynthesizeChallengeQuestion(challenge);
  }

  const answer = challenge.answers.find((entry) => entry.id === target.answerId);
  if (!answer) {
    return true;
  }

  return shouldSynthesizeSoundMatchAnswer(answer);
}
