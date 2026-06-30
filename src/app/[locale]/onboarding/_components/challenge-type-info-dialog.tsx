"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

type ChallengeTypeInfoDialogProps = {
  labelKey: string;
  infoKey: string;
};

export function ChallengeTypeInfoDialog({
  labelKey,
  infoKey,
}: ChallengeTypeInfoDialogProps) {
  const t = useTranslations("Onboarding");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={t("viewChallengeInfo")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(labelKey)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <section className="space-y-1">
            <h4 className="font-medium">{t("challengeInfoPurpose")}</h4>
            <p className="text-muted-foreground">
              {t(`challengeTypeInfo.${infoKey}.purpose`)}
            </p>
          </section>
          <section className="space-y-1">
            <h4 className="font-medium">{t("challengeInfoHowItWorks")}</h4>
            <p className="text-muted-foreground">
              {t(`challengeTypeInfo.${infoKey}.howItWorks`)}
            </p>
          </section>
          <section className="space-y-1">
            <h4 className="font-medium">{t("challengeInfoExample")}</h4>
            <p className="text-muted-foreground italic">
              {t(`challengeTypeInfo.${infoKey}.example`)}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
