"use client"
import * as React from "react"

import { Globe } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";



export function Switcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('CommonComponents');

  const locales = [
  { code: 'en', label: t('english'), flag: 'EN' },
  { code: 'fr', label: t('french'), flag: 'FR' },
  { code: 'ar', label: t('arabic'), flag: 'AR' },
];

  const handleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    // Preserve search parameters when changing locale
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${newPath}?${queryString}` : newPath;

    // Force a hard reload after changing the locale:
    router.replace(fullPath); // ensures new page fetches fresh data instantly
    router.refresh(); // forces a refresh for server-side data
  };


  return (
    <DropdownMenu key={locale}> {/* <--- key forces remount on locale change */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={"sm"} >
          {t("selectLanguage")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent  align={locale === "ar" ? "start" :"end"}>
        <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map(l => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleChange(l.code)}
            className={l.code === locale ? "font-bold bg-slate-200 dark:bg-slate-600/50 text-primary " : "cursor-pointer"}
          >
            {l.label}
            {l.code === locale && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
