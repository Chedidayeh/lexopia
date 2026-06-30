"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface SubscriptionSuccessToastProps {
  onOpen?: () => void;
}

export function SubscriptionSuccessToast({ onOpen }: SubscriptionSuccessToastProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("SubscriptionSuccess");

  useEffect(() => {
    const paymentSuccess = searchParams.get("payment");
    const plan = searchParams.get("plan");

    if (paymentSuccess === "success" && plan) {
      // Format plan name for display
      const formattedPlan = plan
        .replace("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
      
      // Trigger confetti callback
      if (onOpen) {
        setTimeout(() => {
          onOpen();
        }, 2000);
      }

      // Show toast
      toast.success(t("title"), {
        description: (
          <div className="flex items-center gap-2">
            <span>{t("message")}</span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {formattedPlan}
            </span>
          </div>
        ),
        icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
        duration: 5000,
      });

      // Clean up URL parameters
      router.replace("/");
    }
  }, [searchParams, router, onOpen, t]);

  return null;
}
