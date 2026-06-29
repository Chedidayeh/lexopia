import { CreditCard, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Refund Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Our Refund Policy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              At Lexopia, we want you to be completely satisfied with our reading platform. This Refund Policy 
              outlines the circumstances under which refunds are available for our subscription services. Please 
              read this policy carefully before making a purchase.
            </p>
          </section>

          {/* Free Trial */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Free Trial Period
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Lexopia offers a free trial period for new users. During this trial, you can explore all features 
              of our platform without any commitment. No payment is required until the trial period ends. You may 
              cancel at any time during the trial period without being charged.
            </p>
          </section>

          {/* Refund Eligibility */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Refund Eligibility
              </h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-slate-400">
              <p className="leading-relaxed">
                You may be eligible for a refund under the following circumstances:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Within 14 days of your initial subscription purchase, if you have not used the service extensively</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>If the service is not functioning as described due to technical issues on our end</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>If you were charged in error or without your authorization</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Non-Refundable Situations */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Non-Refundable Situations
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Refunds are not available in the following situations:
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>After the 14-day initial refund period has expired</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>If you have used the service extensively during the refund period</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>For partial months of a subscription (refunds are prorated to the billing cycle)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>If you cancel your subscription but fail to do so before the auto-renewal date</span>
              </li>
            </ul>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              How to Request a Refund
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400">
              <p className="leading-relaxed">
                To request a refund, please follow these steps:
              </p>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Contact our support team at lexopiaapp@gmail.com</li>
                <li>Provide your account email address and subscription details</li>
                <li>Explain the reason for your refund request</li>
                <li>Our team will review your request within 3-5 business days</li>
                <li>If approved, refunds will be processed within 5-10 business days</li>
              </ol>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Refund Process
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400">
              <p className="leading-relaxed">
                Once your refund is approved:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>The refund will be credited back to your original payment method</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Processing time depends on your payment provider (typically 5-10 business days)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>You will receive a confirmation email when the refund is processed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Your account access will be terminated upon refund processing</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Subscription Cancellation */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Subscription Cancellation
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              You can cancel your subscription at any time through your account settings. Cancellation prevents 
              future charges but does not entitle you to a refund for the current billing period. Your access 
              will continue until the end of your current billing cycle.
            </p>
          </section>

          {/* Exceptions */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Exceptions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We reserve the right to make exceptions to this policy on a case-by-case basis. If you have special 
              circumstances that you believe warrant consideration, please contact our support team with details 
              of your situation.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We may update this Refund Policy from time to time. Changes will be posted on this page with an 
              updated revision date. Your continued use of our service after changes constitutes acceptance of 
              the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              If you have questions about this Refund Policy or need to request a refund, please contact us at{" "}
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
