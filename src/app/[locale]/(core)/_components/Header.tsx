"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Rocket, Zap } from "lucide-react";
import Profile from "@/src/components/shared/Profile";
import { ModeToggle } from "@/src/components/shared/ModeToggle";

const Header = () => {
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const session = useSession();

  useEffect(() => {
    const fetchSubscriptionPlan = async () => {
      try {
        const response = await fetch("/api/user/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionPlan(data.subscriptionPlan);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plan:", error);
      }
    };

    if (session.data?.user) {
      fetchSubscriptionPlan();
    }
  }, [session.data?.user]);

  const renderSubscriptionBadge = () => {
    if (!subscriptionPlan) {
      return null;
    }

    const currentPlan = subscriptionPlan;

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium shadow-sm transition-all ${
          currentPlan === "FREE"
            ? "border-gray-300 bg-gray-200 text-gray-700 dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-200"
            : currentPlan === "PRO"
            ? "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200"
            : "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200"
        }`}
      >
        {currentPlan === "FREE" && <span>⭐</span>}
        {currentPlan === "PRO" && <Zap className="h-3 w-3" />}
        {currentPlan === "PRO_PLUS" && <Rocket className="h-3 w-3" />}
        <span className="capitalize">{currentPlan.replace("_", " ")}</span>
      </div>
    );
  };

  return (
    <>
      <header className="hidden md:block sticky top-0 z-50 bg-card border-b border-black/20 shadow-warm">
        <div className="container mx-auto px-8 py-3">
          <div className="flex items-center justify-between gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img src="/logo.png" alt="Lexopia" className="w-30" />
            </Link>

            <div className="flex-1 flex justify-center" />

            <div className="shrink-0 flex items-center gap-3">
              {renderSubscriptionBadge()}
              <Profile session={session.data!} />
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-black/10 shadow-warm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src="/logo.png" alt="Lexopia" className="w-30" />
          </Link>

          <div className="flex items-center gap-2">
            {renderSubscriptionBadge()}
            <Profile session={session.data!} />
            <ModeToggle />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
