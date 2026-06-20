"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "parent" | "teacher";
}

const faqItems: FAQItem[] = [
  {
    id: "p1",
    category: "parent",
    question: "Is Lexopia safe for my child?",
    answer:
      "Yes! Safety is our top priority. All stories are carefully curated and age-appropriate. We don't collect unnecessary personal data, use end-to-end encryption for all communications, and have robust parental controls. Your child can enjoy Lexopia with complete peace of mind.",
  },
  {
    id: "p2",
    category: "parent",
    question: "How does Lexopia adapt to my child's reading level?",
    answer:
      "Lexopia uses AI to personalize every child's experience. When your child starts, they take a quick reading assessment. As they progress through stories and riddles, the platform learns their pace and interests, automatically adjusting story difficulty and hint complexity to keep them challenged but not frustrated.",
  },
  {
    id: "p3",
    category: "parent",
    question: "Can I track my child's progress?",
    answer:
      "Absolutely! You get a dedicated parent dashboard showing reading time, stories completed, comprehension scores, skill growth, and milestones reached. You'll receive weekly progress reports by email and can set reading goals together with your child.",
  },
  {
    id: "p4",
    category: "parent",
    question: "What if my child gets stuck on a riddle?",
    answer:
      "Three levels of hints guide your child to the answer without giving it away. Hints progress from text-based clues to visual hints to audio hints. You can also enable 'help mode' to allow your child to request assistance while still learning problem-solving skills.",
  },
  {
    id: "p5",
    category: "parent",
    question: "Is there screen time control and offline reading?",
    answer:
      "Yes! You can set daily reading time limits in parental controls, and Premium users can download up to 10 stories for offline reading. We also encourage reading breaks with our Safari mode for extended reading sessions.",
  },
  {
    id: "p6",
    category: "parent",
    question: "How much does it cost?",
    answer:
      "Lexopia is free to get started with 5 stories and basic features. Premium Student ($9.99/month or $99/year) unlocks 50+ stories and adaptive learning. Premium Educator ($19.99/month or $199/year) includes classroom tools. All paid plans include a 14-day free trial with no credit card required.",
  },
  {
    id: "p7",
    category: "parent",
    question: "What age group is Lexopia for?",
    answer:
      "Lexopia is designed for children ages 6-11. Our algorithm ensures each child gets age-appropriate and reading-level-appropriate content, so a 6-year-old beginner and an 11-year-old advanced reader can both thrive on the same platform.",
  },
  {
    id: "p8",
    category: "parent",
    question: "Can multiple children use one account?",
    answer:
      "Yes! Family plans support up to 6 child profiles. Each child has their own reading level assessment, progress tracking, and personalized recommendations. This makes Lexopia perfect for families with kids of different ages.",
  },
  {
    id: "t1",
    category: "teacher",
    question: "How can I assign stories to my class?",
    answer:
      "With Premium Educator, you can create a classroom in your dashboard and add up to 35 students. Assign stories, set deadlines, and organize reading by unit or theme. Students can read on their own schedules while you monitor progress in real-time.",
  },
  {
    id: "t2",
    category: "teacher",
    question: "Can I see analytics for my entire class?",
    answer:
      "Yes! The Educator Dashboard shows class-wide metrics: average reading time, completion rates, comprehension scores, and identify struggling or high-performing students. Compare performance across assignments and track skill development over time.",
  },
  {
    id: "t3",
    category: "teacher",
    question: "How does adaptive difficulty work for groups of students?",
    answer:
      "Each student in your class gets personalized difficulty based on their individual level. So when you assign a story, advanced readers face more challenging riddles while struggling readers get simpler versions. Everyone learns at their own pace together.",
  },
  {
    id: "t4",
    category: "teacher",
    question: "Can I create my own custom stories and riddles?",
    answer:
      "In our Educator Plus tier (launching Q2), you'll be able to upload your own stories and create custom riddles aligned to curriculum standards. For now, you can filter from our 50+ stories by reading level, theme, and learning objectives.",
  },
  {
    id: "t5",
    category: "teacher",
    question: "Is there a way to integrate Lexopia into our LMS?",
    answer:
      "Yes! Lexopia supports LMS integration via LTI 1.3. Connect Lexopia to Canvas, Google Classroom, Blackboard, or Schoology. Student grades automatically sync, and you can launch Lexopia directly from your course.",
  },
  {
    id: "t6",
    category: "teacher",
    question: "What curriculum standards does Lexopia align with?",
    answer:
      "Lexopia alignments include Common Core English Language Arts, Fountas & Pinnell Benchmark Levels, Guided Reading Levels, and Lexile ranges. All stories and riddles are tagged with these standards so you can ensure alignment with your curriculum.",
  },
  {
    id: "t7",
    category: "teacher",
    question: "Can students give each other peer feedback?",
    answer:
      "Students can view classmates' reading streaks and achievements in the class feed. We're planning collaborative reading circles and peer review features for Q3 2024 to enhance classroom engagement.",
  },
  {
    id: "t8",
    category: "teacher",
    question: "What training and support do educators get?",
    answer:
      "Premium Educator includes priority email and chat support, access to live monthly training webinars, detailed documentation, and a dedicated educator community. We also offer on-demand implementation support for classroom setup.",
  },
];

interface AccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-slate-700/50 bg-slate-800/70 rounded-lg overflow-hidden transition-all duration-300 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className={`
          w-full px-6 py-4 flex items-center justify-between
          transition-all duration-300
          ${
            isOpen
              ? "bg-slate-900/90 border-b border-slate-700/50"
              : "hover:bg-slate-900/90"
          }
        `}
      >
        <span className="text-left text-white text-sm md:text-base">
          {item.question}
        </span>
        <ChevronDown
          className={`
            w-5 h-5 text-primary flex-shrink-0 ml-4
            transition-all duration-300
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>
      <div
        className={`
          overflow-hidden transition-all duration-300
          ${isOpen ? "max-h-96" : "max-h-0"}
        `}
      >
        <div className="px-6 py-4 bg-slate-900/30 text-sm md:text-base text-slate-300 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const [activeTab, setActiveTab] = useState<"parent" | "teacher">("parent");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredItems = faqItems.filter((item) => item.category === activeTab);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="relative py-20">

      <div className="relative max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl text-white font-bold">FAQ</h1>
          <p className="text-lg text-slate-300 drop-shadow-md mt-2">
            Find answers tailored to your role
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-12 justify-center">
          <Button
            variant={activeTab === "parent" ? "default" : "outline"}
            onClick={() => setActiveTab("parent")}
          >
            Parents
          </Button>
          <Button
            variant={activeTab === "teacher" ? "default" : "outline"}
            onClick={() => setActiveTab("teacher")}
          >
            Teachers
          </Button>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm text-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Still have questions?
          </h3>
          <p className="text-slate-300 mb-6">
            Our team is here to help. Reach out anytime.
          </p>
          <Button>Contact Support</Button>
        </div>
      </div>
    </section>
  );
}
