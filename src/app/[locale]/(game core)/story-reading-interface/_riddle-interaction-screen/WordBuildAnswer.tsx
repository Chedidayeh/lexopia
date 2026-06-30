"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { GripHorizontal, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface LetterTile {
  id: string;
  text: string;
}

interface WordBuildAnswerProps {
  tiles: LetterTile[];
  onSubmit: (orderedIds: string[]) => void;
  isDisabled: boolean;
  isLoading?: boolean;
}

const springFast = { type: "spring" as const, stiffness: 600, damping: 32, mass: 0.7 };

const WordBuildAnswer = ({
  tiles,
  onSubmit,
  isDisabled,
  isLoading = false,
}: WordBuildAnswerProps) => {
  const t = useTranslations("StoryReadingInterface.riddleInterface");
  const [orderedTiles, setOrderedTiles] = useState<LetterTile[]>(tiles);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, overIndex: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    const nextTiles = [...orderedTiles];
    const draggedTile = nextTiles[draggedIndex];
    nextTiles.splice(draggedIndex, 1);
    nextTiles.splice(overIndex, 0, draggedTile);
    setDraggedIndex(overIndex);
    setOrderedTiles(nextTiles);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Touch handling for mobile
  const handleTouchStart = (event: React.TouchEvent, index: number) => {
    if (!canInteract) return;
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    setTouchStartIndex(index);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartIndex === null) return;
    event.preventDefault();
  };

  const handleTouchEnd = (event: React.TouchEvent, overIndex: number) => {
    if (touchStartIndex === null || touchStartIndex === overIndex) {
      setTouchStartIndex(null);
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Only reorder if it was a horizontal swipe (not a scroll)
    if (deltaX > 30 && deltaX > deltaY) {
      const nextTiles = [...orderedTiles];
      const draggedTile = nextTiles[touchStartIndex];
      nextTiles.splice(touchStartIndex, 1);
      nextTiles.splice(overIndex, 0, draggedTile);
      setOrderedTiles(nextTiles);
    }

    setTouchStartIndex(null);
  };

  const builtWord = orderedTiles.map((tile) => tile.text).join("");
  const canInteract = !isDisabled && !isLoading;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div>
        <label className="block font-body font-medium text-foreground text-base sm:text-lg mb-2">
          {t("wordBuildAnswer.instructions")}
        </label>
        <p className="font-body text-sm sm:text-base text-muted-foreground">
          {t("wordBuildAnswer.dragHint")}
        </p>
      </div>

      <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 p-4 text-center">
        <p className="font-heading text-2xl sm:text-3xl tracking-[0.2em] text-foreground min-h-10">
          {builtWord || "—"}
        </p>
      </div>

      <div className="rounded-xl border-2 border-border/60 bg-muted/20 p-3 sm:p-4 overflow-x-auto">
        <div className="flex flex-row flex-nowrap justify-center items-stretch gap-2 sm:gap-3 min-w-min mx-auto">
          <AnimatePresence mode="popLayout">
            {orderedTiles.map((tile, index) => (
              <motion.div
                key={tile.id}
                layout="position"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={springFast}
                draggable={canInteract}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(event) => handleTouchStart(event, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(event) => handleTouchEnd(event, index)}
                className={`flex flex-col items-center justify-center shrink-0 w-14 sm:w-16 rounded-xl border-2 transition-colors ${
                  draggedIndex === index || touchStartIndex === index
                    ? "border-secondary bg-secondary/20 opacity-80 scale-105 z-10"
                    : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
                } ${canInteract ? "cursor-grab active:cursor-grabbing touch-none" : "opacity-50 cursor-not-allowed"}`}
              >
                <div className="pt-2 pb-1 text-muted-foreground">
                  <GripHorizontal size={18} aria-hidden />
                </div>
                <span className="font-heading text-2xl sm:text-3xl text-foreground pb-3 px-2">
                  {tile.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center pt-2 sm:pt-4">
        <Button
          onClick={() => onSubmit(orderedTiles.map((tile) => tile.id))}
          disabled={isDisabled || isLoading}
          variant="secondary"
          className="w-full sm:w-auto min-w-40"
        >
          {isLoading ? (
            <span>{t("wordBuildAnswer.checking")}</span>
          ) : (
            <span className="flex items-center gap-2">
              <Check size={20} />
              {t("wordBuildAnswer.submit")}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WordBuildAnswer;
