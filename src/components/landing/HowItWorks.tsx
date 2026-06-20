"use client";

import { BookOpen, HelpCircle, Lightbulb, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}

const steps: Step[] = [
  {
    id: 1,
    icon: <BookOpen className="w-8 h-8" />,
    title: "Read Stories",
    description: "Dive into magical tales designed for your reading level",
    details: [
      "Choose from 50+ curated stories",
      "Stories adapted to your age and level",
      "Beautiful illustrations and optional narration",
    ],
  },
  {
    id: 2,
    icon: <HelpCircle className="w-8 h-8" />,
    title: "Face Riddles",
    description: "Test your comprehension with mind-bending challenges",
    details: [
      "Riddles appear at key story moments",
      "Text input or multiple choice options",
      "Immediate feedback on your answers",
    ],
  },
  {
    id: 3,
    icon: <Lightbulb className="w-8 h-8" />,
    title: "Get Hints",
    description: "Receive personalized guidance when you need it",
    details: [
      "3 progressive hint levels",
      "Text, visual, and optional audio hints",
      "Hints never give away the answer",
    ],
  },
  {
    id: 4,
    icon: <Trophy className="w-8 h-8" />,
    title: "Progress & Reward",
    description: "Track your growth and celebrate achievements",
    details: [
      "Earn stars and badges",
      "Watch your reading level grow",
      "Unlock new stories as you advance",
    ],
  },
];

interface StepCardProps {
  step: Step;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  index: number;
}

function StepCard({ step, isHovered, onHover, index }: StepCardProps) {
  return (
    <div
      onMouseEnter={() => onHover(step.id)}
      onMouseLeave={() => onHover(null)}
      className="relative group cursor-pointer"
    >
      {/* Card */}
      <div
        className={`
          relative p-6 rounded-2xl
          bg-gradient-to-br from-slate-800/70 to-slate-900/80
          border border-slate-700/50
          backdrop-blur-sm
          transition-all duration-300
          ${
            isHovered
              ? "scale-105 shadow-2xl"
              : "hover:shadow-xl"
          }
        `}
      >
        {/* Step Number Badge */}
        <div
          className={`
            absolute -top-4 -left-4
            w-10 h-10 rounded-full
            flex items-center justify-center font-bold text-lg bg-primary
            text-white
            transition-all duration-300
            ${isHovered ? "scale-125 shadow-2xl" : ""}
          `}
        >
          {step.id}
        </div>

        {/* Content */}
        <div className="flex flex-col items-start h-full">
          {/* Icon */}
          <div
            className={`
              mb-4 p-2 rounded-lg
              bg-gradient-to-br from-cyan-500/20 to-purple-500/20
              text-cyan-300
              transition-all duration-300
              ${isHovered ? "rotate-12 scale-110" : ""}
            `}
          >
            {step.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-4 flex-1">
            {step.description}
          </p>

          {/* Details */}
          <div className="w-full space-y-2">
            {step.details.map((detail, idx) => (
              <div
                key={idx}
                className={`
                  flex items-start gap-2 text-xs text-slate-400
                  transition-all duration-300
                  ${isHovered ? "translate-x-1 text-slate-200" : ""}
                `}
              >
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hover Glow Border */}
        <div
          className={`
            absolute inset-0 rounded-2xl pointer-events-none
            bg-gradient-to-r from-cyan-500/0 via-purple-500/10 to-amber-500/0
            transition-all duration-300
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section className="relative py-20 " id="how-it-works">
      <div className="relative  max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-4xl sm:text-5xl text-white font-bold">
            How It Works
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Your journey to becoming a better reader in 4 simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              isHovered={hoveredId === step.id}
              onHover={setHoveredId}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-300 mb-6 drop-shadow-md">
            Ready to start your adventure?
          </p>
          <Button>Begin Reading Now</Button>
        </div>
      </div>
    </section>
  );
}
