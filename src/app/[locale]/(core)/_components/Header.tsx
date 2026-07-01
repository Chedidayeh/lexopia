"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  Users,
  Library,
  LogIn,
  Zap,
  Rocket,
  CircleFadingArrowUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/src/components/shared/ModeToggle";
import { useSession } from "next-auth/react";
import Profile from "@/src/components/shared/Profile";
import { LoginForm } from "@/src/components/shared/login-form";
import { RoleType } from "@/src/types/types";
import { useTranslations } from "next-intl";
import { Switcher } from "@/src/components/shared/Switcher";
import RoleIndicator from "@/src/components/shared/RoleIndicator";
import { useLocale } from "@/src/contexts/LocaleContext";

const Header = ({ userRole }: { userRole: RoleType | undefined }) => {
  const t = useTranslations("CoreHeader");
  const { isRTL } = useLocale();
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

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 bg-card border-b border-black/20 shadow-warm">
        <div className="container mx-auto px-8 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="Lexopia" className=" w-30" />
            </Link>

            {/* Center Navigation (keeps nav visually centered) */}
            <div className="flex-1 flex justify-center"></div>

            {/* Right - Login component (fixed to the far right) */}
            <div className="shrink-0 flex items-center gap-3">
   {showUpgradeButton && (
  <Link
    href="/#pricing"
    className="
      inline-flex animate-pulse items-center gap-1.5
      px-3 py-1.5 text-sm font-medium
      rounded-full transition-all duration-300

      bg-amber-100 text-amber-700 hover:bg-amber-200
      dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25
    "
  >
    <CircleFadingArrowUp className="w-4 h-4 text-current" />
    Upgrade
  </Link>
)}

{subscriptionPlan && (
  <div
    className={`
      inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium
      border shadow-sm transition-all

      ${
        subscriptionPlan === "FREE"
          ? "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600"
          : subscriptionPlan === "PRO"
          ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/30"
          : "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
      }
    `}
  >
    {subscriptionPlan === "FREE" && <span>⭐</span>}
    {subscriptionPlan === "PRO" && <Zap className="w-3 h-3" />}
    {subscriptionPlan === "PRO_PLUS" && <Rocket className="w-3 h-3" />}

    <span className="capitalize">
      {subscriptionPlan.replace("_", " ")}
    </span>
  </div>
)}

              <Profile session={session.data!} />
              <ModeToggle />
              {/* <Switcher /> */}
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-black/10 shadow-warm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Lexopia" className=" w-30" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
  {showUpgradeButton && (
  <Link
    href="/#pricing"
    className="
      inline-flex animate-pulse items-center gap-1.5
      px-3 py-1.5 text-sm font-medium
      rounded-full transition-all duration-300

      bg-amber-100 text-amber-700 hover:bg-amber-200
      dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25
    "
  >
    <CircleFadingArrowUp className="w-4 h-4 text-current" />
    Upgrade
  </Link>
)}

{subscriptionPlan && (
  <div
    className={`
      inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium
      border shadow-sm transition-all

      ${
        subscriptionPlan === "FREE"
          ? "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600"
          : subscriptionPlan === "PRO"
          ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/30"
          : "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
      }
    `}
  >
    {subscriptionPlan === "FREE" && <span>⭐</span>}
    {subscriptionPlan === "PRO" && <Zap className="w-3 h-3" />}
    {subscriptionPlan === "PRO_PLUS" && <Rocket className="w-3 h-3" />}

    <span className="capitalize">
      {subscriptionPlan.replace("_", " ")}
    </span>
  </div>
)}


            <Profile session={session.data!} />
                        <ModeToggle />

          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
