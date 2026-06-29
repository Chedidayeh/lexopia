import { motion, AnimatePresence } from "framer-motion";
import { StoryPage, splitSentences } from "./storyDataTransform";
import Image from "next/image";
import { useEffect, useRef } from "react";
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
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Scroll to top when page changes (for mobile view)
  useEffect(() => {
    if (window.innerWidth < 768 && storyContainerRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage.pageNumber]);

  // Scroll to highlighted sentence when audio is playing
  useEffect(() => {
    if (highlightedSentence !== undefined && sentenceRefs.current[highlightedSentence]) {
      const highlightedElement = sentenceRefs.current[highlightedSentence];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [highlightedSentence]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={storyContainerRef}
        key={currentPage.pageNumber}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col gap-8 px-2 ${highContrast ? "bg-black text-white" : "text-foreground"}`}
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
              ref={(el) => {
                sentenceRefs.current[idx] = el;
              }}
              className={
                idx === highlightedSentence
                  ? "bg-accent rounded-sm"
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
