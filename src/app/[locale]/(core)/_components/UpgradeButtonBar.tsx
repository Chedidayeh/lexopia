"use client";

import Link from "next/link";
import { CircleFadingArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function UpgradeButtonBar() {
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const showUpgradeButton =
    subscriptionPlan === "FREE" || subscriptionPlan === "PRO";

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

  if (!showUpgradeButton) {
    return null;
  }

  return (
    <div className="md:hidden flex justify-end px-4 py-3">
      <Link
        href="/#pricing"
        className="inline-flex animate-pulse items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
      >
        <CircleFadingArrowUp className="h-4 w-4 text-current" />
        Upgrade
      </Link>
    </div>
  );
}