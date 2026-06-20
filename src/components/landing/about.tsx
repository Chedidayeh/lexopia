"use client";

import { BookMarked, Brain, Gamepad, Sparkles } from "lucide-react";
import { useState } from "react";

interface ValueProp {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const valueProps: ValueProp[] = [
  {
    icon: <BookMarked className="w-6 h-6" />,
    title: "Curated Stories",
    description:
      "Handpicked tales from classic literature and modern authors, carefully selected for each age group and reading level.",
    color: "cyan",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Learning",
    description:
      "Adaptive difficulty adjusts in real-time based on your child's progress, ensuring challenging but achievable riddles.",
    color: "purple",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: <Gamepad className="w-6 h-6" />,
    title: "Gamified Growth",
    description:
      "Earn badges, unlock achievements, and build reading streaks. Learning feels like an exciting adventure, not a chore.",
    color: "amber",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
];

interface StatData {
  value: string;
  label: string;
}

const stats: StatData[] = [
  { value: "50+", label: "Stories" },
  { value: "200+", label: "Riddles" },
  { value: "15K+", label: "Happy Readers" },
  { value: "98%", label: "Progress Rate" },
];

export function About() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative py-20" >
      <div className="relative max-w-6xl mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left: Mission + Stats */}
          <div>
            <div className="text-left mb-8 md:mb-12">
              <h1 className="text-4xl sm:text-5xl text-white font-bold">
                Built for Educators,
                <br />
                Loved by Children
              </h1>
              <p className="text-lg md:text-xl mt-4 text-slate-300 max-w-3xl drop-shadow-md leading-relaxed">
                Lexopia transforms reading from a task into an adventure. We
                believe every child deserves engaging stories and personalized
                learning experiences that match their unique pace and interests.
                Our platform combines the best of literature with cutting-edge
                AI to create the perfect reading companion.
              </p>
            </div>

            {/* Stats placed under the mission on the left column */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-600/50 rounded-2xl p-6 mt-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">
                By the Numbers
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="text-left">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Value Props */}
          <div>
            <div className="grid grid-cols-1 gap-6">
              {valueProps.map((prop, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group cursor-pointer"
                >
                  <div
                    className={`
                      relative p-6 rounded-2xl
                      bg-gradient-to-br from-slate-800/70 to-slate-900/90
                      border border-slate-600/50
                      backdrop-blur-sm
                      transition-all duration-300
                      h-full
                      ${
                        hoveredIndex === index
                          ? "scale-105 shadow-2xl border-opacity-100 border-slate-600/50"
                          : "hover:shadow-lg"
                      }
                    `}
                  >
                    <div
                      className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${prop.gradient} ${prop.color === "cyan" ? "text-cyan-300" : prop.color === "purple" ? "text-purple-300" : "text-amber-300"} transition-all duration-300 ${hoveredIndex === index ? "scale-110 rotate-6" : ""}`}
                    >
                      {prop.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {prop.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-md">
            <h4 className="text-xl font-bold text-amber-300 mb-3">
              For Educators
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Comprehensive analytics show you exactly how each student is
              progressing. Track reading comprehension, identify struggling
              learners, and celebrate milestones together. Assign stories and
              monitor class progress in real-time.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-md">
            <h4 className="text-xl font-bold text-purple-300 mb-3">
              For Children
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              A safe, fun, and rewarding reading experience designed just for
              you. Discover stories you&apos;ll love, solve fascinating riddles, and
              watch yourself grow as a reader. Your adventure starts here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
