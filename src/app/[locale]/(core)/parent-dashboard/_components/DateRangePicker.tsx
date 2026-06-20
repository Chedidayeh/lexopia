"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useTranslations } from "next-intl";
import { Calendar } from "@/src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { getDateRangePresets, type TimeRange } from "../_lib/stats";

interface DateRangePickerProps {
  value: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  childJoiningDate?: Date; // Earliest date child can have data for
}

/**
 * DateRangePicker Component
 * Allows parents to select a reading time range using preset buttons or custom calendar selection
 * Presets: Last 3 Days, Last 7 Days, Last 30 Days
 * Custom: Click calendar icon to select custom date range
 */
export default function DateRangePicker({ value, onRangeChange, childJoiningDate }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("ParentDashboard");
  
  // Get today's date (start of day)
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Get the earliest selectable date (child joining date or today - 30 days, whichever is later)
  const getEarliestDate = () => {
    if (!childJoiningDate) return new Date(new Date().setDate(new Date().getDate() - 30));
    const joining = new Date(childJoiningDate);
    joining.setHours(0, 0, 0, 0);
    return joining;
  };

  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: value?.startDate,
    to: getToday(), // Always initialize "to" as today
  });

  const presets = getDateRangePresets();

  // Determine which preset is currently active
  const getActivePreset = (): string | null => {
    if (!value?.startDate || !value?.endDate) return null;
    
    for (const [key, preset] of Object.entries(presets)) {
      const startMatch =
        value.startDate.toISOString().split("T")[0] ===
        preset.startDate.toISOString().split("T")[0];
      const endMatch =
        value.endDate.toISOString().split("T")[0] ===
        preset.endDate.toISOString().split("T")[0];
      if (startMatch && endMatch) {
        return key;
      }
    }
    return null;
  };

  const activePreset = getActivePreset();

  const handlePresetClick = (presetKey: string) => {
    const preset = presets[presetKey];
    onRangeChange(preset);
    setDateRange({ from: preset.startDate, to: preset.endDate });
  };

  const handleApplyCustomRange = () => {
    if (dateRange.from) {
      const today = getToday();
      
      onRangeChange({
        startDate: dateRange.from,
        endDate: today,
        label: undefined, // No label for custom ranges
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const start = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-3 mb-6">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          {t("timeAnalytics.dateRangePicker.selectTimePeriod")}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets).map(([key, preset]) => {
            const earliestDate = getEarliestDate();
            // Disable preset if it goes before child joining date
            const isDisabled = preset.startDate < earliestDate;
            return (
              <Button
                key={key}
                variant={activePreset === key ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(key)}
                disabled={isDisabled}
                className="rounded-lg"
                title={isDisabled ? t("timeAnalytics.dateRangePicker.presetBeforeJoining") : ""}
              >
                {t(`timeAnalytics.presets.${key}`)}
              </Button>
            );
          })}

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activePreset === null ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {t("timeAnalytics.dateRangePicker.custom")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{t("timeAnalytics.dateRangePicker.from")}</p>
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    disabled={(date) => {
                      const today = getToday();
                      const earliestDate = getEarliestDate();
                      // Disable dates after today or before child joining date
                      return date > today || date < earliestDate;
                    }}
                  />
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  {dateRange.from ? (
                    <p>
                      {t("timeAnalytics.dateRangePicker.from")} {dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to today ({getToday().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
                    </p>
                  ) : (
                    <p>{t("timeAnalytics.dateRangePicker.selectStartDate")}</p>
                  )}
                </div>

                <Button
                  onClick={handleApplyCustomRange}
                  disabled={!dateRange.from}
                  className="w-full"
                >
                  {t("timeAnalytics.dateRangePicker.apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {value?.label ? (
        <p className="text-xs text-muted-foreground">{t("timeAnalytics.dateRangePicker.showing")} {value.label.toLowerCase()}</p>
      ) : value?.startDate && value?.endDate ? (
        <p className="text-xs text-muted-foreground">
          {t("timeAnalytics.dateRangePicker.showing")} {formatDateRange(value.startDate, value.endDate)}
        </p>
      ) : null}
    </div>
  );
}
