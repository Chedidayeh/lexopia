import { BookOpen, Target, Users, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            About Lexopia
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Transforming young readers into confident learners through interactive stories and intelligent challenges.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Target className="w-10 h-10 text-primary" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Our Mission
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            At Lexopia, we believe every child deserves the opportunity to become a confident reader. 
            Our mission is to make reading engaging, accessible, and fun through personalized AI-powered stories 
            that adapt to each child's unique learning journey. We combine cutting-edge technology with proven 
            educational methods to create an immersive reading experience that builds confidence, vocabulary, 
            and comprehension skills.
          </p>
        </div>

        {/* What We Do */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              What We Do
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            Lexopia creates personalized reading adventures for children aged 5-12. Our AI-powered platform generates 
            unique stories tailored to each child's reading level, interests, and learning pace. Every story includes 
            interactive challenges that reinforce comprehension and critical thinking skills while keeping children engaged 
            and motivated.
          </p>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Personalized story generation based on reading level and interests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Interactive challenges that test comprehension and vocabulary</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Progress tracking for parents to monitor their child's development</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Adaptive learning that grows with your child</span>
            </li>
          </ul>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Passion for Learning
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We're driven by a genuine passion for helping children discover the joy of reading and learning.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Child-Centered
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Every feature we build is designed with children's needs, safety, and engagement at the forefront.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Innovation
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We leverage AI and technology to create innovative learning experiences that were never possible before.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start the Reading Journey?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of families who are already using Lexopia to help their children become confident readers.
          </p>
          <a
            href="/"
            className="inline-block bg-white text-primary font-medium px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}
