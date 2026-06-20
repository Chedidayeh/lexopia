"use client";

import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/src/contexts/LocaleContext";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export default function DashboardTabs({
  activeTab,
  onTabChange,
  children,
}: DashboardTabsProps) {
  const t = useTranslations("ParentDashboard");
    const {isRTL} = useLocale();
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {/* Tabs Container with loading state styling */}
      <div
        className={`transition-all duration-200 ${"pointer-events-auto opacity-100"}`}
      >
        {/* Desktop: Grid layout */}
        <TabsList dir={isRTL ? "rtl" : "ltr"} className="hidden md:grid w-full grid-cols-4 mb-4 md:mb-6">
          <TabsTrigger value="overview" className="font-medium text-sm">
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="reading-plan" className="font-medium text-sm">
            {t("tabs.readingPlan")}
          </TabsTrigger>
          <TabsTrigger value="riddle-analytics" className="font-medium text-sm">
            {t("tabs.riddleStatistics")}
          </TabsTrigger>
          <TabsTrigger value="time-analytics" className="font-medium text-sm">
            {t("tabs.timeAnalytics")}
          </TabsTrigger>
        </TabsList>

        {/* Mobile: Select dropdown */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">{t("tabs.overview")}</SelectItem>
              <SelectItem value="reading-plan">{t("tabs.readingPlan")}</SelectItem>
              <SelectItem value="riddle-analytics">
                {t("tabs.riddleStatistics")}
              </SelectItem>
              <SelectItem value="time-analytics">
                {t("tabs.timeAnalytics")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {children}
      </div>
    </Tabs>
  );
}
