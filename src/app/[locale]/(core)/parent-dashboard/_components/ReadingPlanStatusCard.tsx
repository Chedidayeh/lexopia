"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { getReadingPlanStatusAction } from "@/src/lib/reading-plan/server-actions";
import type { ReadingPlanStatusView } from "@/src/lib/reading-plan/types";

interface ReadingPlanStatusCardProps {
  childId: string;
  refreshKey?: number;
}

function ReadingPlanStatusCardContent({ childId }: { childId: string }) {
  const t = useTranslations("ParentDashboard.readingPlan");
  const [status, setStatus] = useState<ReadingPlanStatusView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getReadingPlanStatusAction(childId);
      setStatus(result);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.status !== "GENERATING") {
      return;
    }

    const interval = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [status?.status, fetchStatus]);

  if (isLoading && !status) {
    return (
      <div className="rounded-xl border border-black/10 bg-card p-4 md:p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("generatingTitle")}</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status.status === "GENERATING") {
    return (
      <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/50 bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 md:p-6">
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 mt-0.5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <h3 className="font-heading text-lg text-blue-900 dark:text-blue-100">
              {t("generatingTitle")}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              {t("generatingDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.status === "FAILED") {
    return (
      <div className="rounded-xl border border-red-200/50 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 p-4 md:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <h3 className="font-heading text-lg text-red-900 dark:text-red-100">
              {t("failedTitle")}
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              {status.generationError || t("failedDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.status === "ACTIVE" && status.isActive) {
    return (
      <div className="rounded-xl border border-green-200/50 dark:border-green-800/50 bg-green-50/80 dark:bg-green-950/30 p-4 md:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <h3 className="font-heading text-lg text-green-900 dark:text-green-100">
              {t("readyTitle")}
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              {t("readyDescription", {
                ready: status.readyStories,
                total: status.totalStories,
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-card p-4 md:p-6">
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
        <div>
          <h3 className="font-heading text-lg text-foreground">
            {t("readyTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("readyDescription", {
              ready: status.readyStories,
              total: status.totalStories,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReadingPlanStatusCard({
  childId,
  refreshKey = 0,
}: ReadingPlanStatusCardProps) {
  return (
    <ReadingPlanStatusCardContent
      key={`${childId}-${refreshKey}`}
      childId={childId}
    />
  );
}
