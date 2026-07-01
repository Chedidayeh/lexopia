"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { cancelSubscriptionAction } from "@/src/actions/auth-actions";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange, onSuccess }: CancelSubscriptionDialogProps) {
  const t = useTranslations("CancelSubscription");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [endsAt, setEndsAt] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await cancelSubscriptionAction();
      
      console.log("Cancel subscription result:", result);
      
      if (result.success && result.data?.endsAt) {
        setSuccess(true);
        setEndsAt(result.data.endsAt);
        onSuccess?.();
        router.refresh();
        onOpenChange(false);
        setSuccess(false);
        setEndsAt(null);
      } else if (!result.success) {
        console.error("Failed to cancel subscription:", result);
        setError(result.error.message || "Failed to cancel subscription");
      } else {
        setError("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {success ? (
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-4" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
            )}
            <DialogTitle className="text-2xl">
              {success ? "Subscription Cancelled" : t("title")}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {success 
                ? `Your subscription will remain active until ${endsAt ? formatEndDate(endsAt) : 'the end of your billing period'}.`
                : t("message")
              }
            </DialogDescription>
          </div>
        </DialogHeader>
        
        {!success && (
          <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-sm text-amber-200">
              {t("warning")}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-200">
              {error}
            </p>
          </div>
        )}

        {!success && (
          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("keepPlan")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? t("loading") : t("cancelButton")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
