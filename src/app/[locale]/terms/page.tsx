import { FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Terms of Service
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
              Welcome to Lexopia. These Terms of Service govern your use of our reading platform and services. 
              By accessing or using Lexopia, you agree to be bound by these terms. If you do not agree to these 
              terms, please do not use our service.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Acceptance of Terms
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              By creating an account and using Lexopia, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms of Service and our Privacy Policy. If you are using Lexopia on behalf of 
              a child, you confirm that you have the legal authority to accept these terms on their behalf.
            </p>
          </section>

          {/* Account Responsibilities */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Account Responsibilities
              </h2>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You must be at least 18 years old to create an account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You are responsible for maintaining the confidentiality of your account credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You are responsible for all activities that occur under your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You must notify us immediately of any unauthorized use of your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You must provide accurate and complete information when creating your account</span>
              </li>
            </ul>
          </section>

          {/* Subscription and Payment */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Subscription and Payment
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400">
              <p className="leading-relaxed">
                Lexopia offers both free and paid subscription plans. Paid subscriptions are billed on a recurring 
                basis (monthly or annually) and will automatically renew unless you cancel your subscription 
                before the renewal date.
              </p>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  Payment Terms
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>All fees are charged in the currency selected at checkout</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>We reserve the right to change our pricing at any time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Price changes will apply to new subscriptions and renewals</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Acceptable Use
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              You agree not to use Lexopia for any unlawful purpose or in any way that could damage the service. 
              Specifically, you must not:
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Use the service to harass, abuse, or harm others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Attempt to gain unauthorized access to our systems</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Copy, modify, or distribute our content without permission</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Use automated tools to access the service excessively</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Interfere with or disrupt the service or servers</span>
              </li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Intellectual Property
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All content on Lexopia, including stories, illustrations, characters, and software, is protected 
              by intellectual property laws. You may not use, copy, or distribute our content without our express 
              written permission. Your use of Lexopia does not grant you any ownership rights to our content.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Termination
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these 
              Terms of Service or for any other reason at our sole discretion. Upon termination, your right 
              to use the service will immediately cease. You may also terminate your account at any time 
              through your account settings.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Disclaimer
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Lexopia is provided on an "as is" and "as available" basis. We make no warranties, expressed or 
              implied, regarding the operation of the service or the information, content, or materials included 
              on the service. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Limitation of Liability
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To the fullest extent permitted by law, Lexopia shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including without limitation, loss of profits, data, 
              use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify users of significant 
              changes by posting the new terms on our platform and updating the "Last updated" date. Your continued 
              use of the service after such modifications constitutes your acceptance of the new terms.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{" "}
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
