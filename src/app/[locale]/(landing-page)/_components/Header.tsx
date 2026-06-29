"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Users, Library, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "@/src/components/shared/ModeToggle";
import { Session } from "next-auth";
import Profile from "@/src/components/shared/Profile";
import { LoginForm } from "@/src/components/shared/login-form";
import { Switcher } from "@/src/components/shared/Switcher";
import { Button } from "@/src/components/ui/button";
import { RoleType } from "@/src/types/types";

const Header = ({ session }: { session: Session | null }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "How It Works",
      icon: Users,
      href: "#how-it-works",
    },
    {
      label: "Pricing",
      icon: Users,
      href: "#pricing",
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const user = session?.user;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50">
        <div className="container mx-auto px-8 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="Lexopia"
                className=" w-30"
              />
            </Link>

            {/* Right - Login component (fixed to the far right) */}
            <div className="flex-shrink-0 flex items-center gap-3">
              {session?.user.role === RoleType.ADMIN && (
                <Link href={"/admin-dashboard"}>
                  <Button size={"sm"}>Admin</Button>
                </Link>
              )}
              {/* <ModeToggle /> */}
              {/* <Switcher /> */}
              {user ? <Profile session={session} /> : <LoginForm />}{" "}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/logo.png"
              alt="Lexopia"
              className="w-30"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* <ModeToggle /> */}
            {/* <Switcher /> */}
            {user ? <Profile session={session} /> : <LoginForm />}{" "}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
