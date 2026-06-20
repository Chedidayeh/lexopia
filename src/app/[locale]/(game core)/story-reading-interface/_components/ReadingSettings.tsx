"use client";

import { Lightbulb, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ReadingSettingsProps {
  textSize: "small" | "medium" | "large";
  onTextSizeChange: (size: "small" | "medium" | "large") => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  onClose: () => void;
}

const ReadingSettings = ({
  textSize,
  onTextSizeChange,
  highContrast,
  onHighContrastToggle,
  onClose,
}: ReadingSettingsProps) => {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
  
    const handleChange = (newLocale: string) => {
      if (newLocale === locale) return;
      // Replace only the locale code at the beginning of the pathname
      // e.g., /fr/story-reading-interface/... → /en/story-reading-interface/...
      const newPath = pathname.replace(/^\/[a-z]{2}\//, `/${newLocale}/`);
      
      // Preserve search parameters (e.g., ?childId=...)
      const queryString = searchParams.toString();
      const newPathWithParams = queryString ? `${newPath}?${queryString}` : newPath;
  
      // Force a hard reload after changing the locale:
      router.replace(newPathWithParams); // ensures new page fetches fresh data instantly
      router.refresh(); // forces a refresh for server-side data
    };

  const t = useTranslations("StoryReadingInterface");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-card rounded-xl shadow-warm-xl p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-heading text-xl sm:text-2xl text-foreground">
            {t("readingSettings.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-accent hover:text-white rounded-full transition-smooth flex-shrink-0 ml-2"
            aria-label={t("readingSettings.closeButton")}
          >
            <X size={20} className="sm:size-6" />
          </button>
        </div>

        {/* Text Size */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-body font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">
            {t("readingSettings.textSize")}
          </label>
          <div className="flex gap-2 sm:gap-3">
            {(["small", "medium", "large"] as const).map((size) => {
              const sizeLabels = {
                small: t("readingSettings.small"),
                medium: t("readingSettings.medium"),
                large: t("readingSettings.large"),
              };
              return (
                <button
                  key={size}
                  onClick={() => onTextSizeChange(size)}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-body font-medium text-xs sm:text-sm transition-smooth ${
                    textSize === size
                      ? "bg-accent text-accent-foreground shadow-warm"
                      : "bg-muted hover:bg-accent/20"
                  }`}
                >
                  <span
                    className={
                      size === "small"
                        ? "text-sm"
                        : size === "medium"
                          ? "text-base"
                          : "text-lg"
                    }
                  >
                    {sizeLabels[size]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-4 sm:mb-6">
          <label className="block font-body font-semibold text-sm sm:text-base text-foreground mb-2 sm:mb-3">
            {t("readingSettings.language")}
          </label>
          <div className="flex gap-2 sm:gap-3">
            {(["en", "fr", "ar"] as const).map((lang) => {
              const languageLabels = {
                en: t("readingSettings.english"),
                fr: t("readingSettings.french"),
                ar: t("readingSettings.arabic"),
              };
              return (
                <button
                  key={lang}
                  onClick={() => handleChange(lang)}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-body font-medium text-xs sm:text-sm transition-smooth ${
                    locale === lang
                      ? "bg-accent text-accent-foreground shadow-warm"
                      : "bg-muted hover:bg-accent/20"
                  }`}
                >
                  <span className="text-xs sm:text-base">
                    {languageLabels[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* High Contrast */}
        {/* <div className="mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="block font-body font-semibold text-foreground mb-1">
                High Contrast Mode
              </span>
              <span className="block font-caption text-sm text-muted-foreground">
                Easier reading for visual accessibility
              </span>
            </div>
            
          </label>
        </div> */}

        {/* Reading Tips */}
        <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Lightbulb className="text-accent w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-semibold text-sm sm:text-base text-foreground mb-1">
                {t("readingSettings.readingTip")}
              </p>
              <p className="font-caption text-xs sm:text-sm text-muted-foreground">
                {t("readingSettings.readingTipText")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingSettings;
