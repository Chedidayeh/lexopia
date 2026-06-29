"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, Crown, Rocket } from "lucide-react";
import { SubscriptionPlan } from "@/src/types/types";

export default function PaymentSuccessPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    async function refreshSession() {
      try {
        // Fetch fresh user data from database
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.subscriptionPlan);
        }
      } catch (error) {
        console.error("Failed to refresh session:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    refreshSession();
  }, []);

  useEffect(() => {
    // After showing the success page for 3 seconds, reload to refresh the session
    if (!isRefreshing && currentPlan) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, currentPlan]);

  const handleContinue = () => {
    router.push("/");
  };

  if (isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent mx-auto mb-4" />
          <p className="text-white/80">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  const planName = currentPlan === SubscriptionPlan.PRO_PLUS ? "Pro Plus" : currentPlan === SubscriptionPlan.PRO ? "Pro" : "Free";
  const planIcon = currentPlan === SubscriptionPlan.PRO_PLUS ? <Rocket className="h-8 w-8 text-sky-300" /> : currentPlan === SubscriptionPlan.PRO ? <Crown className="h-8 w-8 text-amber-300" /> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 text-center shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Payment Successful!
          </h1>

          <p className="text-white/80 mb-6 text-lg">
            Thank you for subscribing to the <span className="font-semibold text-white">{planName}</span> plan
          </p>

          <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-2">
              {planIcon}
              <span className="text-2xl font-bold text-white">{planName}</span>
            </div>
            <p className="text-white/60 text-sm">Your subscription is now active</p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30"
          >
            Go back
          </button>

          <p className="text-white/50 text-sm mt-4">
            You can manage your subscription anytime from your account settings
          </p>
        </div>
      </div>
    </div>
  );
}
