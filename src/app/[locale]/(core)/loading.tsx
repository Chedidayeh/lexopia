"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("CommonComponents");

  return (
    <>

      <div className="fixed inset-0 z-99 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-3">
            <span
              className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"
              aria-hidden="true"
            />
            <span>{t("loading")}</span>
          </span>
        </div>
      </div>
    </>
  );
}
