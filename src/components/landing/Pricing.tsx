"use client";

import { Check } from "lucide-react";
import { useState } from "react";

interface PricingTier {
  id: string;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlight?: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    subtitle: "For curious readers",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started with reading adventures",
    features: [
      "5 free stories to start",
      "3 riddle attempts per story",
      "1 hint level available",
      "Basic progress tracking",
      "Community forum access",
      "Safari mode for uninterrupted reading",
    ],
    cta: "Get Started",
  },
  {
    id: "student",
    name: "Premium Student",
    subtitle: "For serious readers",
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    description: "Unlock the full reading library with AI-powered guidance",
    features: [
      "Access to 50+ stories",
      "Unlimited riddle attempts",
      "3 hint levels with visual hints",
      "Adaptive difficulty algorithm",
      "Detailed reading analytics",
      "Offline story downloads",
      "Reading streak tracker",
      "Monthly achievements unlocked",
    ],
    cta: "Start Free Trial",
    popular: true,
    highlight: "Most Popular",
  },
  {
    id: "educator",
    name: "Premium Educator",
    subtitle: "For teachers & schools",
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    description: "Manage classrooms and monitor student progress",
    features: [
      "Everything in Premium Student",
      "Classroom management tools",
      "Assign stories to students",
      "Real-time progress monitoring",
      "Class-wide analytics dashboard",
      "Advanced student segmentation",
      "Monthly educator insights report",
      "Priority email support",
      "Bulk student account creation",
    ],
    cta: "Start Free Trial",
  },
];

interface PricingCardProps {
  tier: PricingTier;
  isYearly: boolean;
  isPopular: boolean;
}

function PricingCard({ tier, isYearly, isPopular }: PricingCardProps) {
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  const savings = isYearly
    ? Math.round(
        ((tier.monthlyPrice * 12 - tier.yearlyPrice) /
          (tier.monthlyPrice * 12)) *
          100,
      )
    : 0;

  return (
    <div className={`relative transition-all duration-300 h-full`}>
      {/* Card */}
      <div
        className={`
          relative p-8 rounded-2xl h-full
          flex flex-col
          transition-all duration-300
          ${
            isPopular
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/30 border-2 border-amber-400/50 shadow-2xl scale-100 md:scale-105 z-10"
              : "bg-gradient-to-br from-slate-800/70 to-slate-900/80 border border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl"
          }
          backdrop-blur-sm
        `}
      >
        {/* Highlight Badge */}
        {tier.highlight && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-white text-xs drop-shadow-lg">
            {tier.highlight}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
          <p className="text-sm text-slate-400">{tier.subtitle}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-bold text-white">${price}</span>
            <span className="text-slate-400">
              {isYearly ? "/year" : "/month"}
            </span>
          </div>
          {isYearly && savings > 0 && (
            <p className="text-xs text-green-400 font-semibold">
              Save {savings}% with yearly billing
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2">{tier.description}</p>
        </div>

        {/* CTA Button */}
        <button
          className={`
            w-full py-3 px-4 rounded-xl mb-8
            transition-all duration-300
            ${
              isPopular
                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:shadow-2xl hover:scale-105 active:scale-95"
                : "bg-slate-700/50 text-white hover:bg-slate-600 active:scale-95"
            }
          `}
        >
          {tier.cta}
        </button>

        {/* Features List */}
        <div className="space-y-4 flex-1">
          {tier.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check
                className={`
                  w-5 h-5 flex-shrink-0 mt-0.5
                  ${isPopular ? "text-amber-400" : "text-cyan-400"}
                `}
              />
              <span className="text-sm text-slate-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      className="relative  py-20"
    >

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl text-white font-bold">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg md:text-xl mt-2 text-slate-300 max-w-2xl mx-auto drop-shadow-md mb-8">
            Choose the perfect plan for your reading journey. Always flexible.
            Always fair.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${
                !isYearly ? "text-white" : "text-slate-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`
                relative w-14 h-8 rounded-full p-1
                transition-all duration-300
                ${isYearly ? "bg-primary" : "bg-slate-700"}
              `}
            >
              <div
                className={`
                  w-6 h-6 rounded-full bg-white
                  transition-all duration-300
                  ${isYearly ? "translate-x-6" : "translate-x-0"}
                `}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                isYearly ? "text-white" : "text-slate-400"
              }`}
            >
              Yearly
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isYearly={isYearly}
              isPopular={tier.popular || false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
