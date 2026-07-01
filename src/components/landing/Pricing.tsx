/* eslint-disable react/no-unescaped-entities */
"use client";

import { Check, Crown, Sparkles, Zap, Rocket } from "lucide-react";
import { selectSubscriptionPlanAction, createCheckoutAction, cancelSubscriptionAction, upgradeSubscriptionAction } from "@/src/actions/auth-actions";
import { useSession } from "next-auth/react";
import { SubscriptionPlan } from "@/src/types/types";
import { PricingPlanButton } from "./pricing-plan-button";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { User } from "@/src/lib/dashboard/types";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { downgradeSubscriptionAction } from "@/src/actions/auth-actions";

type Plan = {
  key: SubscriptionPlan;
  name: string;
  badge?: string;
  tagline: string;
  price: string;
  tone: string;
  features: string[];
};

const plans: Plan[] = [
  {
    key: SubscriptionPlan.FREE,
    name: "Free",
    tagline: "A simple start for every family.",
    price: "0",
    tone: "from-emerald-400/20 via-cyan-400/10 to-transparent",
    features: [
      "1 child profile",
      "1 story per week",
      "1 selected theme",
      "Basic reading plan generation with 1 roadmap and 1 world",
      "Try the core reading journey",
      "Simple challenge types",
    ],
  },
  {
    key: SubscriptionPlan.PRO,
    name: "Pro",
    badge: "Most balanced",
    tagline: "The everyday family plan.",
    price: "19.99",
    tone: "from-amber-400/25 via-orange-400/15 to-transparent",
    features: [
      "Up to 3 child profiles",
      "3 stories per week",
      "Up to 3 selected themes",
      "More themes and story variety",
      "Only core challenge types",
      "Enhanced reading plan generation",
    ],
  },
  {
    key: SubscriptionPlan.PRO_PLUS,
    name: "Pro Plus",
    badge: "Premium",
    tagline: "The premium tier.",
    price: "29.99",
    tone: "from-sky-400/25 via-indigo-400/15 to-transparent",
    features: [
      "Up to 5 child profiles",
      "7 stories per week",
      "Up to 5 selected themes",
      "The fullest reading experience, all challenge types included",
      "Priority support for families",
    ],
  },
];

const featureMatrix: Array<{ label: string; free: string; pro: string; proPlus: string }> = [
  { label: "Themes", free: "1", pro: "3", proPlus: "5" },
  { label: "Stories per week", free: "1", pro: "3", proPlus: "7" },
  { label: "Challenge types", free: "3", pro: "6", proPlus: "9" },
  { label: "Worlds per roadmap", free: "1", pro: "2-3", proPlus: "2-3" },
  { label: "Episodes per world", free: "4", pro: "6", proPlus: "8" },
  { label: "Chapters per story", free: "6", pro: "8", proPlus: "10" },
];

function PlanCard({
  plan,
  index,
  currentPlan,
  subscriptionStatus,
  subscriptionRenewsAt,
  subscriptionCancelledAt,
  isLoggedIn,
  user,
}: {
  plan: Plan;
  index: number;
  currentPlan?: SubscriptionPlan;
  subscriptionStatus?: string | null;
  subscriptionRenewsAt?: Date | string | null;
  subscriptionCancelledAt?: Date | string | null;
  isLoggedIn: boolean;
  user: User | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false);
  const [downgradeError, setDowngradeError] = useState<string | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const isFeatured = index === 1;
  const isCurrentPlan = currentPlan === plan.key;
  const isSubscriptionCancelled = subscriptionStatus === "cancelled";
  const hasSubscriptionId = Boolean(user?.lemonSqueezySubscriptionId);
  
  // Disable upgrade buttons if user is already on a paid plan
  const isPaidPlan = currentPlan === SubscriptionPlan.PRO || currentPlan === SubscriptionPlan.PRO_PLUS;
  const isProPlusUpgrade = currentPlan === SubscriptionPlan.PRO && plan.key === SubscriptionPlan.PRO_PLUS && hasSubscriptionId;
  const isProPlusDowngrade = currentPlan === SubscriptionPlan.PRO_PLUS && plan.key === SubscriptionPlan.PRO && hasSubscriptionId;
  const isUpgradeDisabled = isPaidPlan && plan.key !== SubscriptionPlan.FREE && !isCurrentPlan && !isProPlusUpgrade && !isProPlusDowngrade;
  
  // Check if clicking FREE plan is actually a downgrade from paid plan
  const isDowngradeToFree = isPaidPlan && plan.key === SubscriptionPlan.FREE && !isCurrentPlan;

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the appropriate date to display
  const expiryDate = subscriptionCancelledAt || subscriptionRenewsAt || null;
  const renewalDate = isSubscriptionCancelled ? formatDate(expiryDate) : formatDate(subscriptionRenewsAt || null);
  const dateLabel = isSubscriptionCancelled ? "Expires on" : "Renews on";
  const daysUntilExpiry = useMemo(() => {
    if (!isSubscriptionCancelled || !expiryDate) {
      return null;
    }

    const targetDate = new Date(expiryDate);
    const diffMs = targetDate.getTime() - mountedAt;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 0);
  }, [expiryDate, isSubscriptionCancelled, mountedAt]);

  const handleCheckout = async () => {
    if (!isLoggedIn || !user?.id || plan.key === SubscriptionPlan.FREE) return;
    
    setIsLoading(true);
    try {
      const result = await createCheckoutAction(plan.key);
      
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        console.error("Checkout failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout failed", error);
      setIsLoading(false);
    }
  };

  const handlePlanAction = () => {
    if (isProPlusDowngrade) {
      setIsDowngradeDialogOpen(true);
      return;
    }

    void handleCheckout();
  };

  const handleProPlusUpgrade = async () => {
    if (!isLoggedIn || !hasSubscriptionId) return;

    setIsLoading(true);
    try {
      const result = await upgradeSubscriptionAction();

      if (result.success) {
        if (result.data?.redirectUrl) {
          window.location.href = result.data.redirectUrl;
          return;
        }

        router.refresh();
        window.location.reload();
      } else {
        console.error("Upgrade failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Upgrade failed", error);
      setIsLoading(false);
    }
  };

  const handleProDowngrade = async () => {
    if (!isLoggedIn || !hasSubscriptionId) return;

    setIsLoading(true);
    setDowngradeError(null);

    try {
      const result = await downgradeSubscriptionAction();

      if (result.success) {
        if (result.data?.redirectUrl) {
          window.location.href = result.data.redirectUrl;
          return;
        }

        router.refresh();
        window.location.reload();
      } else {
        setDowngradeError(result.error.message || "Failed to downgrade subscription");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Downgrade failed", error);
      setDowngradeError("Failed to downgrade subscription");
      setIsLoading(false);
    }
  };

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 ${
        isFeatured
          ? "border-amber-300/40 bg-white/12 shadow-[0_24px_80px_rgba(251,191,36,0.14)]"
          : "border-white/10 bg-white/8"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-linear-to-b ${plan.tone} pointer-events-none`}
      />

      <div className="relative flex h-full flex-col">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-medium text-white">{plan.name}</h3>
              {plan.name === "Pro" ? (
                <Crown className="h-5 w-5 text-amber-300" />
              ) : plan.name === "Pro Plus" ? (
                <Rocket className="h-5 w-5 text-sky-300" />
              ) : null}
            </div>
            <p className="mt-2 text-sm text-white/70">{plan.tagline}</p>
          </div>

          {plan.badge ? (
            <div className="flex flex-col gap-1">
              {plan.name === "Pro" ? (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white border shadow-lg" style={{ background: "linear-gradient(to right, rgba(251, 146, 60, 0.9), rgba(249, 115, 22, 0.9))", borderColor: "rgba(251, 146, 60, 0.5)", boxShadow: "0 4px 12px rgba(251, 146, 60, 0.3)" }}>
                  <Zap className="h-3.5 w-3.5" />
                  {plan.badge}
                </div>
              ) : plan.name === "Pro Plus" ? (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white border shadow-lg" style={{ background: "linear-gradient(to right, rgba(59, 130, 246, 0.9), rgba(99, 102, 241, 0.9))", borderColor: "rgba(59, 130, 246, 0.5)", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
                  <Rocket className="h-3.5 w-3.5" />
                  {plan.badge}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-medium text-white sm:text-5xl">
            ${plan.price} <span className="text-lg font-normal text-white/70">/month</span>
            </span>
          </div>
        </div>


        {plan.key === SubscriptionPlan.FREE ? (
          isSubscriptionCancelled && isDowngradeToFree ? (
            <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-100">
              {daysUntilExpiry !== null && daysUntilExpiry > 0
                ? `Downgrading to Free in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"}`
                : "Downgrading to Free today"}
            </div>
          ) : isProPlusUpgrade ? (
            <button
              type="button"
              onClick={handleProPlusUpgrade}
              disabled={!isLoggedIn || isLoading}
              className="group relative mb-6 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-sky-200/40 bg-linear-to-r from-sky-300 via-indigo-300 to-sky-200 px-4 py-3 text-base font-medium text-slate-950 shadow-lg shadow-sky-300/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-300/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Upgrading...
                  </>
                ) : !isLoggedIn ? (
                  "Log in to choose"
                ) : (
                  "Upgrade to Pro Plus"
                )}
              </span>
            </button>
          ) : isProPlusDowngrade ? (
            <>
              <button
                type="button"
                onClick={() => setIsDowngradeDialogOpen(true)}
                disabled={!isLoggedIn || isLoading}
                className="group relative mb-6 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-amber-200/40 bg-linear-to-r from-amber-300 via-orange-300 to-amber-200 px-4 py-3 text-base font-medium text-slate-950 shadow-lg shadow-amber-300/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-300/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Downgrading...
                    </>
                  ) : !isLoggedIn ? (
                    "Log in to choose"
                  ) : (
                    "Downgrade to Pro"
                  )}
                </span>
              </button>
              {downgradeError ? (
                <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-100">
                  {downgradeError}
                </div>
              ) : null}
            </>
          ) : isPaidPlan && !isCurrentPlan ? (
            <button
              type="button"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={!isLoggedIn || isLoading}
              className="group relative mb-6 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-emerald-200/30 bg-emerald-500/10 px-4 py-3 text-base font-medium text-emerald-100 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {!isLoggedIn ? (
                  "Log in to choose"
                ) : (
                  "Downgrade to Free"
                )}
              </span>
            </button>
          ) : (
            <form action={selectSubscriptionPlanAction.bind(null, plan.key)}>
              <PricingPlanButton
                isLoggedIn={isLoggedIn}
                isCurrentPlan={isCurrentPlan}
                isFeatured={isFeatured}
                planKey={plan.key}
              />
            </form>
          )
        ) : (
          <>
     <div className="relative mb-6">
  {isCurrentPlan && (
    <div className={`absolute -right-2 -top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full border shadow-lg ${
      plan.key === SubscriptionPlan.PRO 
        ? "border-amber-300/40 bg-amber-500 shadow-amber-500/30" 
        : plan.key === SubscriptionPlan.PRO_PLUS 
          ? "border-sky-300/40 bg-sky-500 shadow-sky-500/30" 
          : "border-emerald-300/40 bg-emerald-500 shadow-emerald-500/30"
    }`}>
      <Check className="h-3 w-3 text-white" strokeWidth={3} />
    </div>
  )}

  <button
    onClick={handlePlanAction}
    disabled={!isLoggedIn || isCurrentPlan || isLoading || isUpgradeDisabled}
    className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-base font-medium transition-all duration-300 ease-out ${
      !isLoggedIn
        ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/45"
        : isCurrentPlan
          ? "cursor-default border border-white/30 bg-white/5 text-white"
          : isUpgradeDisabled
            ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/45"
            : isFeatured
              ? "border border-amber-200/40 bg-linear-to-r cursor-pointer from-amber-300 via-orange-300 to-amber-200 text-slate-950 shadow-lg shadow-amber-300/20 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-300/30 active:scale-[0.99]"
              : "border border-white/15 bg-white/8 cursor-pointer text-white hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/12 hover:shadow-lg hover:shadow-black/20 active:scale-[0.99]"
    }`}
  >
    {!isLoggedIn || isCurrentPlan || isUpgradeDisabled ? null : (
      <span className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/25 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
    )}

    <span className="relative z-10 inline-flex items-center gap-2">
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </>
      ) : !isLoggedIn ? (
        "Log in to choose"
      ) : isCurrentPlan ? (
        "Current plan"
                ) : isUpgradeDisabled ? (
        "Disabled"
                ) : isProPlusUpgrade ? (
                  "Upgrade to Pro Plus"
      ) : isProPlusDowngrade ? (
        "Downgrade to Pro"
      ) : (
        `Upgrade to ${plan.name}`
      )}
    </span>
  </button>
</div>

            {isCurrentPlan && renewalDate && (
              <div className="mb-6 flex justify-center">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border ${
                  plan.key === SubscriptionPlan.PRO 
                    ? "text-amber-200 border-amber-500/30 bg-amber-500/10" 
                    : plan.key === SubscriptionPlan.PRO_PLUS 
                      ? "text-sky-200 border-sky-500/30 bg-sky-500/10" 
                      : "text-emerald-200 border-emerald-500/30 bg-emerald-500/10"
                }`}>
                  {dateLabel}: <span className="font-medium">{renewalDate}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-3">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3 text-sm text-white/80">
              <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <CancelSubscriptionDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onSuccess={() => {
          setIsCancelDialogOpen(false);
          router.refresh();
          window.location.reload();
        }}
      />

      <Dialog
        open={isDowngradeDialogOpen}
        onOpenChange={(open) => {
          setIsDowngradeDialogOpen(open);
          if (!open) {
            setDowngradeError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Downgrade to Pro</DialogTitle>
            <DialogDescription>
              Your subscription will be changed from Pro Plus to Pro through Lemon Squeezy.
              The change takes effect immediately.
            </DialogDescription>
          </DialogHeader>

          {downgradeError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {downgradeError}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsDowngradeDialogOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              disabled={isLoading}
            >
              Keep Pro Plus
            </button>
            <button
              type="button"
              onClick={handleProDowngrade}
              className="rounded-md bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "Downgrading..." : "Downgrade to Pro"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function Pricing({ user }: { user: User | null }) {

  const currentPlan = user?.subscriptionPlan
  const subscriptionStatus = user?.subscriptionStatus
  const subscriptionRenewsAt = user?.subscriptionRenewsAt
  const subscriptionCancelledAt = user?.subscriptionCancelledAt
  const isLoggedIn = Boolean(user);
  const userId = user?.id;

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_30%)] pointer-events-none" /> */}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
            Subscription plans for families
          </div>
          <h2 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Pick the plan that matches your child's reading journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
            Free gives families a meaningful start, Pro expands personalization,
            and Pro Plus unlocks the fullest reading experience.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              index={index}
              currentPlan={currentPlan}
              subscriptionStatus={subscriptionStatus}
              subscriptionRenewsAt={subscriptionRenewsAt}
              subscriptionCancelledAt={subscriptionCancelledAt}
              isLoggedIn={isLoggedIn}
              user={user}
            />
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md">
          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <h3 className="text-xl font-medium text-white">Feature comparison</h3>
            <p className="mt-1 text-sm text-white/65">
              A quick view of what each plan includes at a glance.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:p-8">
            <div className="grid grid-cols-4 gap-3 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Pro Plus</div>
            </div>

            {featureMatrix.map((feature) => (
              <div
                key={feature.label}
                className="grid grid-cols-4 gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm text-white/80"
              >
                <div className="font-medium text-white">{feature.label}</div>
                <div className="text-center font-medium text-emerald-300">{feature.free}</div>
                <div className="text-center font-medium text-amber-300">{feature.pro}</div>
                <div className="text-center font-medium text-sky-300">{feature.proPlus}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
