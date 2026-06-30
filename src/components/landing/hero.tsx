"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/src/providers/login-provider";
import { Button } from "../ui/button";
import { FlipWords } from "../ui/flip-words";
import { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { useLocale } from "@/src/contexts/LocaleContext";
import Link from "next/link";
import { usePusherBeams } from "@/src/hooks/use-pusher";

export default function Hero({ session }: { session: Session | null }) {
  const t = useTranslations("Hero");
  const { isRTL } = useLocale();
  const words = [t("words.0"), t("words.1"), t("words.2"), t("words.3")];

  const router = useRouter();
  const loginModal = useLoginModal();

  usePusherBeams(session);
  return (
    <div>
      {/* Hero Content */}
      <div className="text-center max-w-4xl mx-auto px-4 sm:px-0">
        {/* Main Headline */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-white drop-shadow-lg">
            {t("headline")} <br />
            <FlipWords words={words} isRTL={isRTL} />
          </h1>
          <p className="text-base sm:text-lg text-gray-100 drop-shadow-md font-medium">
            {t("subline")}
          </p>
          <p className="text-sm sm:text-base text-gray-200 drop-shadow-md max-w-2xl mx-auto">
            {t("details")}
          </p>
        </div>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 sm:pt-12">
          <Link
            href={
              !session
                ? ""
                : session.user.newUser
                  ? "/onboarding"
                  : "/parent-dashboard"
            }
          >
            <Button
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4"
              size={"responsive"}
              onClick={() => {
                if (!session) {
                  loginModal.open();
                } else if (session.user.newUser) {
                  router.push("/onboarding");
                } else if (session.user.newUser === false) {
                  router.push("/parent-dashboard");
                }
              }}
            >
              {!session
                ? t("cta.getStarted")
                : session.user.newUser
                  ? t("cta.startAdventure")
                  : t("cta.parentDashboard")}
            </Button>
          </Link>

          <Link href="#pricing">
            <Button
            variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-white/20 bg-white/10 text-white hover:bg-white/15"
              size={"responsive"}
            >
              See plans
            </Button>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="mt-6 sm:mt-10">
          <p className="text-gray-200 drop-shadow-md">{t("trust")}</p>
        </div>
      </div>
    </div>
  );
}
