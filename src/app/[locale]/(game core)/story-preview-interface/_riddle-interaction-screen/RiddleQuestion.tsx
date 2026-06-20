import { Pause, Play, Puzzle, Clock } from "lucide-react";
import { ChallengeType } from "@readdly/shared-types";
import { useTranslations } from "next-intl";
import Image from "next/image";
interface RiddleQuestionProps {
  question: string;
  storyImage: string | null;
  storyImageAlt: string;
  riddleNumber: number;
  totalRiddles: number;
  onAudioPlay: () => void;
  isAudioPlaying: boolean;
  elapsedTime?: number;
  challengeType?: ChallengeType;
  hasAudio?: boolean;
}

const RiddleQuestion = ({
  question,
  storyImage,
  storyImageAlt,
  riddleNumber,
  totalRiddles,
  onAudioPlay,
  isAudioPlaying,
  elapsedTime = 0,
  challengeType,
  hasAudio = false,
}: RiddleQuestionProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");

  const getTypeLabel = (type?: ChallengeType): string => {
    switch (type) {
      case ChallengeType.TRUE_FALSE:
        return t("riddleQuestion.trueOrFalse");
      case ChallengeType.MULTIPLE_CHOICE:
        return t("riddleQuestion.multipleChoice");
      case ChallengeType.SEQUENCING:
        return t("riddleQuestion.sequencing");
      case ChallengeType.FILL_BLANK:
        return t("riddleQuestion.fillBlank");
      case ChallengeType.COMPLETE_WORD:
        return t("riddleQuestion.completeWord");
      case ChallengeType.LETTER_DISCRIMINATION:
        return t("riddleQuestion.letterDiscrimination");
      case ChallengeType.SOUND_MATCH:
        return t("riddleQuestion.soundMatch");
      case ChallengeType.READ_ALOUD:
        return t("riddleQuestion.readAloud");
      case ChallengeType.WORD_BUILD:
        return t("riddleQuestion.wordBuild");
      default:
        return t("riddleQuestion.defaultQuestion");
    }
  };
  return (
    <div className="bg-card rounded-xl shadow-warm-lg p-6">
      {/* Riddle Counter */}


      {/* Elapsed Time Display */}
      {/* <div className="mb-6 flex items-center gap-2 p-3 bg-secondary/10 rounded-lg w-fit">
        <Clock size={20} className="text-secondary" />
        <span className="font-heading text-lg text-foreground">
          {t("riddleQuestion.timeDisplay", { seconds: elapsedTime })}
        </span>
      </div> */}

      {/* Story Context Image */}
      {/* <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6 shadow-warm">
        <img
          src={storyImage}
          alt={storyImageAlt}
          className="w-full h-full object-cover"
        />
      </div> */}

      {/* Riddle Question */}
      <div className="bg-secondary/10 rounded-xl p-4 border-2 border-secondary/30">
      <div className="flex items-center justify-center mb-">
        {hasAudio && (
          <button
            onClick={onAudioPlay}
            className="p-3 rounded-full bg-secondary text-white hover:scale-105 transition-smooth shadow-warm"
            aria-label={
              isAudioPlaying
                ? t("riddleQuestion.stopAudio")
                : t("riddleQuestion.playAudio")
            }
          >
            {isAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}
      </div>
        <label className="block font-heading text-sm text-secondary mb-3">
          {getTypeLabel(challengeType)}
        </label>
        {storyImage && (
          <div className="flex items-center justify-center">
            <div className="w-md rounded-xl overflow-hidden">
              <Image
                src={storyImage}
                alt={storyImageAlt}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <p className="font-body text-xl md:text-2xl text-foreground leading-relaxed text-center">
          {question}
        </p>
      </div>
    </div>
  );
};

export default RiddleQuestion;
