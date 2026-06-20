import { motion, AnimatePresence } from "framer-motion";
import { StoryPage, splitSentences } from "./storyDataTransform";
import Image from "next/image";
interface StoryContentProps {
  currentPage: StoryPage;
  textSize: "small" | "medium" | "large";
  highContrast: boolean;
  highlightedSentence?: number;
  onWordHelp?: (wordIndex: number) => void;
}

const StoryContent = ({
  currentPage,
  textSize,
  highContrast,
  highlightedSentence,
}: StoryContentProps) => {
  const textSizeClasses = {
    small: "text-lg md:text-xl",
    medium: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl",
  };

  const sentences = splitSentences(currentPage.text);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage.pageNumber}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col gap-8 ${highContrast ? "bg-black text-white" : "text-foreground"}`}
      >
        {/* Story Image */}
        {currentPage.image && (
          <div className="flex items-center justify-center">
            <div className="w-lg rounded-xl overflow-hidden shadow-warm-lg">
              <Image 
                src={currentPage.image}
                alt={currentPage.alt}
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        {/* Story Text */}
        <div
          className={`font-body ${textSizeClasses[textSize]} leading-relaxed`}
        >
          {sentences.map((sentence, idx) => (
            <span
              key={idx}
              className={
                idx === highlightedSentence
                  ? "bg-accent text-accent-foreground rounded-lg px-0.5 py-0.5 font-medium"
                  : ""
              }
            >
              {sentence}
            </span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryContent;
