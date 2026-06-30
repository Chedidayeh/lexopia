"use client";

import { CircleCheck } from "lucide-react";
import { motion } from "framer-motion";

const TOTAL_STEPS = 4;

export function StepIndicator({ step }: { step: number }) {
  const progressPercentage = (step / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <motion.div
            key={s}
            className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm transition-all ${
              s < step
                ? "bg-primary text-primary-foreground"
                : s === step
                  ? "bg-primary/70 text-primary-foreground border-2 border-primary"
                  : "bg-muted text-muted-foreground"
            }`}
            animate={{ scale: s === step ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {s < step ? (
              <CircleCheck className="w-5 h-5 text-background" />
            ) : (
              s
            )}
          </motion.div>
        ))}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-primary to-primary/70 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export { TOTAL_STEPS };
