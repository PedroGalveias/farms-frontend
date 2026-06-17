"use client";

import { Sprout } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n";

// Swiss seasonal calendar (by month index 0–11) — the produce typically in
// season here. Emoji are language-neutral; names stay in English to match the
// app's product/category data. Approximate, in the spirit of a Saisonkalender.
const SWISS_SEASONAL: string[][] = [
  ["🍎 Apples", "🍐 Pears", "🥬 Cabbage", "🥕 Carrots", "🧅 Onions", "🥔 Potatoes"],
  ["🍎 Apples", "🥬 Cabbage", "🥕 Carrots", "🧅 Onions", "🥔 Potatoes", "🥬 Lamb's lettuce"],
  ["🥕 Carrots", "🥬 Spinach", "🥗 Lettuce", "🍎 Apples", "🌿 Chives", "🥬 Lamb's lettuce"],
  ["🥬 Asparagus", "🥗 Lettuce", "🌱 Spinach", "🌶️ Radishes", "🌿 Rhubarb", "🥕 Carrots"],
  ["🍓 Strawberries", "🥬 Asparagus", "🥗 Lettuce", "🌿 Rhubarb", "🫛 Peas", "🌶️ Radishes"],
  ["🍓 Strawberries", "🍒 Cherries", "🥒 Cucumbers", "🥗 Lettuce", "🫛 Peas", "🍑 Apricots"],
  ["🍒 Cherries", "🍑 Apricots", "🫐 Berries", "🍅 Tomatoes", "🥒 Cucumbers", "🫑 Peppers"],
  ["🍑 Peaches", "🫐 Plums", "🍅 Tomatoes", "🌽 Corn", "🫑 Peppers", "🫛 Beans"],
  ["🍇 Grapes", "🍎 Apples", "🍐 Pears", "🎃 Pumpkins", "🍅 Tomatoes", "🌽 Corn"],
  ["🍎 Apples", "🍐 Pears", "🍇 Grapes", "🎃 Pumpkins", "🥬 Cabbage", "🍄 Mushrooms"],
  ["🍎 Apples", "🍐 Pears", "🎃 Pumpkins", "🥬 Cabbage", "🥕 Carrots", "🥔 Potatoes"],
  ["🍎 Apples", "🍐 Pears", "🥬 Cabbage", "🥕 Carrots", "🥔 Potatoes", "🥬 Lamb's lettuce"],
];

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
  const now = new Date();
  const items = SWISS_SEASONAL[now.getMonth()] ?? [];
  const monthName = now.toLocaleDateString([INTL_LOCALE[locale], "en"], {
    month: "long",
  });

  return (
    <div className="col-span-2 flex min-h-[220px] flex-col justify-between rounded-[24px] border border-line bg-cloud p-5 sm:row-span-2 sm:min-h-0">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-pine/10 text-pine">
          <Sprout className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40">
          {t("season_label")}
        </span>
      </div>

      <div>
        <p className="text-lg font-bold capitalize tracking-[-0.02em] text-ink">
          {monthName}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              className="rounded-full bg-tone px-3 py-1.5 text-sm font-semibold text-ink/70"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-ink/50">{t("season_promo")}</p>
      </div>
    </div>
  );
}
