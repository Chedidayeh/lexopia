"use client";

import Link from "next/link";
// policies are right-aligned; no ModeToggle here

const Footer = () => {
  return (
    <footer className="mt-12 bg-card border-t border-black/20 shadow-warm">
      <div className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="order-1 md:order-1 w-full md:w-auto flex items-center justify-start">
            <Link
              href="/"
              className="font-heading z-10 text-xl font-bold hover:opacity-80 transition-opacity"
            >
              Lexopia
            </Link>
          </div>

          <div className="order-2 md:order-2 w-full flex justify-center mt-3 md:mt-0 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <nav className="flex gap-6">
              <Link
                href="#"
                className="text-foreground hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-foreground hover:text-primary transition-colors"
              >
                Cookies
              </Link>
            </nav>
          </div>

          <div className="order-3 w-full md:w-auto md:flex-none text-center md:text-right mt-3 md:mt-0">
            <div className="text-sm text-foreground/70">
               {new Date().getFullYear()} Lexopia. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
