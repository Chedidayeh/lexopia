import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Tajawal } from "next/font/google";
import "../globals.css";
import { LoginProvider } from "@/src/providers/login-provider";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "../../providers/theme-provider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "../../components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { LocaleProvider } from "../../contexts/LocaleContext";
import { Local } from "../../types/types";
const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"], // Fredoka supports multiple weights
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "Lexopia - Stories that make you think!",
  description:
    "An interactive story-based riddle game for young readers aged 6-11. Read stories, solve riddles, and learn while having fun!",
  keywords: [
    "reading",
    "children",
    "riddles",
    "stories",
    "learning",
    "education",
    "kids",
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const isRTL = locale === "ar";
  return (
    <html dir={isRTL ? "rtl" : "ltr"} lang={locale}>
      <body
        className={` ${isRTL ? tajawal.className : fredoka.className} antialiased bg-background  `}
      >
        <NextIntlClientProvider>
          <NextTopLoader color="#F59E0B" showSpinner={false} />
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <LocaleProvider locale={locale as Local}>
                <LoginProvider>{children}</LoginProvider>
                <Toaster />
              </LocaleProvider>
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
