import { ChallengeType } from "@prisma/client";
import type { TtsChallengeContext } from "./types";
import {
  buildChallengeQuestionScript,
  buildSoundMatchAnswerScript,
} from "./challenge-tts-scripts";

export type ChallengeQuestionTtsTarget = {
  kind: "challenge-question";
  challengeId: string;
  order: number;
  text: string;
};

export type SoundMatchAnswerTtsTarget = {
  kind: "sound-match-answer";
  challengeId: string;
  answerId: string;
  order: number;
  text: string;
};

export type TtsTarget = ChallengeQuestionTtsTarget | SoundMatchAnswerTtsTarget;

export function buildChallengeTtsTargets(
  challenge: TtsChallengeContext,
): TtsTarget[] {
  const targets: TtsTarget[] = [
    {
      kind: "challenge-question",
      challengeId: challenge.id,
      order: challenge.order,
      text: buildChallengeQuestionScript({
        type: challenge.type,
        question: challenge.question,
        targetWord: challenge.targetWord,
        sentenceTemplate: challenge.sentenceTemplate,
      }),
    },
  ];

  if (challenge.type === ChallengeType.SOUND_MATCH) {
    for (const answer of challenge.answers) {
      targets.push({
        kind: "sound-match-answer",
        challengeId: challenge.id,
        answerId: answer.id,
        order: answer.order,
        text: buildSoundMatchAnswerScript(answer.text),
      });
    }
  }

  return targets;
}

export function buildStoryChallengeTtsTargets(
  challenges: TtsChallengeContext[],
): TtsTarget[] {
  return challenges.flatMap(buildChallengeTtsTargets);
}
