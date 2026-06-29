import { Shield, Eye, Lock, Trash2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              At Lexopia, we take your privacy and the privacy of your children seriously. 
              This Privacy Policy explains how we collect, use, and protect your personal information 
              when you use our reading platform. By using Lexopia, you agree to the practices described 
              in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-slate-400">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Account Information
                </h3>
                <p className="leading-relaxed">
                  When you create an account, we collect your name, email address, and payment information 
                  (processed securely through third-party payment providers).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Child Profile Information
                </h3>
                <p className="leading-relaxed">
                  For each child profile, we collect name, age, reading level, interests, and learning preferences 
                  to personalize their reading experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Usage Data
                </h3>
                <p className="leading-relaxed">
                  We collect information about how children interact with stories, including reading progress, 
                  challenge performance, and time spent reading. This data helps us improve the learning experience.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Personalize reading content based on each child's level and interests</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Track reading progress and provide insights to parents</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Improve our AI algorithms and content recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Send important account and subscription notifications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Provide customer support</span>
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Data Security
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption, 
              secure servers, and regular security audits. Your child's data is stored securely and is never 
              shared with third parties for marketing purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Your Rights
              </h2>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Access and review your personal information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Update or correct inaccurate information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Delete your account and associated data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Opt-out of marketing communications</span>
              </li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Children's Privacy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Lexopia is designed for children and we comply with all applicable children's privacy laws. 
              We do not collect more information than necessary to provide our service, and we never 
              sell or rent children's personal information to third parties.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:lexopiaapp@gmail.com" className="text-primary hover:underline">
                lexopiaapp@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
