'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { GripVertical, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SequenceItem {
  id: string;
  text: string;
}

interface SequencingAnswerProps {
  items: SequenceItem[];
  onSubmit: (reorderedIndices: number[]) => void;
  isDisabled: boolean;
  isLoading?: boolean;
}

const SequencingAnswer = ({
  items,
  onSubmit,
  isDisabled,
  isLoading = false,
}: SequencingAnswerProps) => {
  const t = useTranslations('StoryReadingInterface.riddleInterface');
  const [reorderedItems, setReorderedItems] = useState<SequenceItem[]>(items);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, overIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === overIndex) return;

    const newItems = [...reorderedItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(overIndex, 0, draggedItem);

    setDraggedIndex(overIndex);
    setReorderedItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = () => {
    // Create mapping of new order back to original indices
    const reorderedIndices = reorderedItems.map((item) =>
      items.findIndex((original) => original.id === item.id)
    );
    onSubmit(reorderedIndices);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div>
        <label className="block font-body font-medium text-foreground text-base sm:text-lg mb-2">
          {t('sequencingAnswer.instructions') || 'Arrange these events in the correct order:'}
        </label>
        <p className="font-body text-sm sm:text-base text-muted-foreground">
          {t('sequencingAnswer.dragHint') || 'Drag and drop to reorder'}
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <AnimatePresence mode="popLayout">
          {reorderedItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              draggable={!isDisabled && !isLoading}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 sm:p-5 rounded-xl border-2 transition-smooth ${
                draggedIndex === index
                  ? 'border-secondary bg-secondary/20 opacity-70'
                  : 'border-border bg-card hover:border-secondary/50 hover:bg-secondary/5'
              } ${!isDisabled && !isLoading ? 'cursor-grab active:cursor-grabbing' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Grip Handle */}
                <div className="shrink-0 pt-1 text-muted-foreground hover:text-secondary transition-colors">
                  <GripVertical size={20} />
                </div>

                {/* Position Badge */}
                <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center">
                  <span className="font-heading font-medium text-secondary text-sm sm:text-base">
                    {index + 1}
                  </span>
                </div>

                {/* Event Text */}
                <span className="font-body text-base sm:text-lg text-foreground flex-1 wrap-break-word">
                  {item.text}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-2 sm:pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isDisabled || isLoading}
          variant="secondary"
          className="w-full sm:w-auto min-w-40"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {t('sequencingAnswer.checking') || 'Checking...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check size={20} />
              {t('sequencingAnswer.submit') || 'Check Order'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SequencingAnswer;
