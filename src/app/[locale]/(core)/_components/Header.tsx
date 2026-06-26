"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Users, Library, LogIn, Menu } from "lucide-react";
import { useState } from "react";
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


  const session = useSession();



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
            <div className="flex-shrink-0 flex items-center gap-3">
              <Profile session={session.data!} />
              <ModeToggle />
              <Switcher />
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

                  {/* Switcher */}
                  <div className="flex items-center gap-2 pt-2">
                    <Profile session={session.data!} />

                    <Switcher />
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
