"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Sprout } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  SEASONAL_BY_MONTH,
  produceEmoji,
  produceLabel,
  seasonalProductsForMonth,
} from "@/lib/seasonal";
import type { Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-CH",
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
  rm: "rm-CH",
};

/**
 * Bento card promoting seasonal, locally-grown produce. Picks the current
 * month's in-season fruits & vegetables for Switzerland, so people are nudged
 * toward what's growing now (local, fresher, lower-impact). Informational.
 */
export default function SeasonalCard() {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const now = new Date();
  const month = now.getMonth();
  const items = SEASONAL_BY_MONTH[month] ?? [];
  // The bento card stays compact — show a handful and let the full calendar
  // carry the rest.
  const CARD_LIMIT = 8;
  const shownItems = items.slice(0, CARD_LIMIT);
  const extraCount = items.length - shownItems.length;
  const monthName = now.toLocaleDateString([INTL_LOCALE[locale], "en"], {
    month: "long",
  });

  // Send the specific in-season products into quick search (match any), which
  // sorts farms by distance ("near you") once the visitor shares their location.
  const findNearby = () => {
    const items = seasonalProductsForMonth(month);
    router.push(
      `/quick-search?products=${encodeURIComponent(items.join(","))}&match=any`,
    );
  };

  return (
    <div className="col-span-2 flex min-h-[220px] flex-col justify-between rounded-[24px] border border-line bg-cloud p-5 sm:row-span-2 sm:min-h-0">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-pine/10 text-pine">
          <Sprout className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
          {t("season_label")}
        </span>
      </div>

      <div>
        <p className="text-lg font-bold capitalize tracking-[-0.02em] text-ink">
          {monthName}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shownItems.map((key) => (
            <span
              className="rounded-full bg-tone px-3 py-1.5 text-sm font-semibold text-ink/70"
              key={key}
            >
              {produceEmoji(key)} {produceLabel(key, locale)}
            </span>
          ))}
          {extraCount > 0 ? (
            <span className="rounded-full bg-tone px-3 py-1.5 text-sm font-semibold text-ink/70">
              +{extraCount}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-ink/60">
          {t("season_promo")}
        </p>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            className="group inline-flex items-center gap-1.5 rounded-full bg-pine dark:bg-[#1c7c47] px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-pine/40 focus-visible:ring-offset-2"
            onClick={findNearby}
            type="button"
          >
            {t("season_cta")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          <Link
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink/60 transition hover:text-ink"
            href="/seasonal"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {t("season_full_calendar")}
          </Link>
        </div>
      </div>
    </div>
  );
}
