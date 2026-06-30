"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { SubscriptionPlan } from "@/src/types/types";

type PricingPlanButtonProps = {
  isLoggedIn: boolean;
  isCurrentPlan: boolean;
  isFeatured: boolean;
  planKey: SubscriptionPlan;
};

function PendingSpinner() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return <Loader2 className="h-4 w-4 animate-spin" />;
}

export function PricingPlanButton({
  isLoggedIn,
  isCurrentPlan,
  isFeatured,
  planKey,
}: PricingPlanButtonProps) {
  const router = useRouter();
  return (
    <RefreshOnSubmit router={router}>
      <button
        type="submit"
        disabled={!isLoggedIn || isCurrentPlan}
        className={`group relative mb-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out ${
          !isLoggedIn
            ? "border border-white/10 bg-white/5 text-white/45"
            : isCurrentPlan
              ? "cursor-default border border-white/30 bg-white/10 text-lg text-white/70"
              : isFeatured
                ? "border border-amber-200/40 bg-linear-to-r from-amber-300 via-orange-300 to-amber-200 text-slate-950 shadow-lg shadow-amber-300/20 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-300/30 active:scale-[0.99]"
                : "border border-white/15 bg-white/8 text-white hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/12 hover:shadow-lg hover:shadow-black/20 active:scale-[0.99]"
        }`}
      >
        {!isLoggedIn || isCurrentPlan ? null : (
          <span className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/25 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
        )}
        <span className="relative z-10 text-base inline-flex items-center gap-2">
          <PendingSpinner />
          {!isLoggedIn
            ? "Log in to choose"
            : isCurrentPlan
              ? "Current plan"
              : planKey === SubscriptionPlan.FREE
                ? "Downgrade to FREE"
                : "Select plan"}
        </span>
      </button>
    </RefreshOnSubmit>
  );
}

function RefreshOnSubmit({
  children,
  router,
}: {
  children: React.ReactNode;
  router: ReturnType<typeof useRouter>;
}) {
  const { pending } = useFormStatus();
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !pending) {
      router.refresh();
    }
    wasPendingRef.current = pending;
  }, [pending, router]);

  return children;
}