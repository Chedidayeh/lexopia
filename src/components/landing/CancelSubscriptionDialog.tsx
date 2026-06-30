"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { createCustomerPortalAction } from "@/src/actions/auth-actions";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange }: CancelSubscriptionDialogProps) {
  const t = useTranslations("CancelSubscription");
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const result = await createCustomerPortalAction();
      
      console.log("Customer portal result:", result);
      
      if (result.success && result.data?.portalUrl) {
        window.location.href = result.data.portalUrl;
      } else {
        console.error("Failed to create customer portal:", result);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to create customer portal:", error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
            <DialogDescription className="text-base mt-2">
              {t("message")}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
          <p className="text-sm text-amber-200">
            {t("warning")}
          </p>
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
