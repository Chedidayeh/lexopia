"use client";
import { useLocale } from "@/src/contexts/LocaleContext";
import { cn } from "@/src/lib/utils";
import { Shield, Eye } from "lucide-react";

interface RoleIndicatorProps {
  role: string;
}

export default function RoleIndicator({ role }: RoleIndicatorProps) {
  const {isRTL} = useLocale();
  const roleConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    PARENT: {
      label: "Parent",
      bgColor: "bg-amber-100 dark:bg-amber-900/50",
      textColor: "text-amber-800 dark:text-amber-200",
    },
    ADMIN: {
      label: "Admin",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      textColor: "text-blue-800 dark:text-blue-200",
    },
  };

  const config = roleConfig[role] || { label: role, bgColor: "bg-gray-100 dark:bg-gray-900/30", textColor: "text-gray-800 dark:text-gray-200" };

  return (
    <div
      className={cn(
        // "fixed top-3",
        // isRTL ? "left-50" : "right-50",
        // "z-99",
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "border border-current/30",
        "text-sm font-medium",
        "transition-all duration-300 ease-out",
        "hover:scale-105 hover:shadow-warm",
        "animate-in fade-in slide-in-from-top-2",
        config.bgColor,
        config.textColor
      )}
    >
      {role === "ADMIN" ? (
        <Shield className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      <span>{config.label} View</span>
    </div>
  );
}
