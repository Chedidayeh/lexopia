"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Users, Library, LogIn, Menu, Zap, Rocket } from "lucide-react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/src/components/shared/ModeToggle";
import { useSession } from "next-auth/react";
import Profile from "@/src/components/shared/Profile";
import { LoginForm } from "@/src/components/shared/login-form";
import { RoleType } from "@/src/types/types";
import { useTranslations } from "next-intl";
import { Switcher } from "@/src/components/shared/Switcher";
import RoleIndicator from "@/src/components/shared/RoleIndicator";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/src/components/ui/sheet";
import { useLocale } from "@/src/contexts/LocaleContext";
import { Separator } from "@/src/components/ui/separator";

const Header = ({ userRole }: { userRole: RoleType | undefined }) => {
  const t = useTranslations("CoreHeader");
  const { isRTL } = useLocale();
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
              <span className="font-heading text-2xl font-bold">Lexopia</span>
            </Link>

            {/* Center Navigation (keeps nav visually centered) */}
            <div className="flex-1 flex justify-center">
     
            </div>

            {/* Right - Login component (fixed to the far right) */}
            <div className="shrink-0 flex items-center gap-3">
              {subscriptionPlan && (
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border shadow-sm"
                  style={{
                    background: subscriptionPlan === "FREE" 
                      ? "linear-gradient(135deg, rgb(107, 114, 128) 0%, rgb(75, 85, 99) 100%)"
                      : subscriptionPlan === "PRO"
                      ? "linear-gradient(135deg, rgb(251, 146, 60) 0%, rgb(249, 115, 22) 100%)"
                      : "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(99, 102, 241) 100%)",
                    borderColor: subscriptionPlan === "FREE"
                      ? "rgba(107, 114, 128, 0.5)"
                      : subscriptionPlan === "PRO"
                      ? "rgba(251, 146, 60, 0.5)"
                      : "rgba(59, 130, 246, 0.5)",
                    boxShadow: subscriptionPlan === "FREE"
                      ? "0 4px 15px rgba(107, 114, 128, 0.2)"
                      : subscriptionPlan === "PRO"
                      ? "0 4px 15px rgba(251, 146, 60, 0.3)"
                      : "0 4px 15px rgba(59, 130, 246, 0.3)"
                  }}
                >
                  {subscriptionPlan === "FREE" && <span>⭐</span>}
                  {subscriptionPlan === "PRO" && <Zap className="w-3.5 h-3.5" />}
                  {subscriptionPlan === "PRO_PLUS" && <Rocket className="w-3.5 h-3.5" />}
                  <span className="text-white">{subscriptionPlan}</span>
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
            <span className="font-heading text-lg font-bold">Lexopia</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1">

            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Toggle menu"
                  className="p-2 rounded-md hover:bg-primary/10 transition"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "left" : "right"} className="w-64">
                <nav className="flex flex-col gap-4 mt-12 mx-4">
          

                  {/* Divider */}
                  <Separator />

                  {/* Plan Badge */}
                  {subscriptionPlan && (
                    <div className="py-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border shadow-sm"
                        style={{
                          background: subscriptionPlan === "FREE" 
                            ? "linear-gradient(135deg, rgb(107, 114, 128) 0%, rgb(75, 85, 99) 100%)"
                            : subscriptionPlan === "PRO"
                            ? "linear-gradient(135deg, rgb(251, 146, 60) 0%, rgb(249, 115, 22) 100%)"
                            : "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(99, 102, 241) 100%)",
                          borderColor: subscriptionPlan === "FREE"
                            ? "rgba(107, 114, 128, 0.5)"
                            : subscriptionPlan === "PRO"
                            ? "rgba(251, 146, 60, 0.5)"
                            : "rgba(59, 130, 246, 0.5)",
                          boxShadow: subscriptionPlan === "FREE"
                            ? "0 4px 15px rgba(107, 114, 128, 0.2)"
                            : subscriptionPlan === "PRO"
                            ? "0 4px 15px rgba(251, 146, 60, 0.3)"
                            : "0 4px 15px rgba(59, 130, 246, 0.3)"
                        }}
                      >
                        {subscriptionPlan === "FREE" && <span>⭐</span>}
                        {subscriptionPlan === "PRO" && <Zap className="w-3.5 h-3.5" />}
                        {subscriptionPlan === "PRO_PLUS" && <Rocket className="w-3.5 h-3.5" />}
                        <span className="text-white">{subscriptionPlan}</span>
                      </div>
                    </div>
                  )}
                  <Separator />

                  {/* Switcher */}
                  <div className="flex items-center gap-2 pt-2">
                    <Profile session={session.data!} />

                    {/* <Switcher /> */}
                    <ModeToggle />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
