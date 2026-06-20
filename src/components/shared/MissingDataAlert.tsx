"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface MissingDataAlertProps {
  message: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function MissingDataAlert({
  message,
  open = true,
  onOpenChange,
}: MissingDataAlertProps) {
  const t = useTranslations("CommonComponents")
  const router = useRouter();
  const onAction = () => {
    router.back();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>{t("missingData")}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-2">
          <p className="text-base font-medium text-foreground">{message}</p>
        </AlertDialogDescription>
        <AlertDialogAction onClick={onAction}>
          {t("goBack")}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
