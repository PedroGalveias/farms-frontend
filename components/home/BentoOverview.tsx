"use client";

import NearestFarmCard from "@/components/NearestFarmCard";
import Reveal from "@/components/motion/Reveal";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { tagLabel } from "@/lib/products";
import type { Farm } from "@/types/farm";

interface BentoOverviewProps {
  farms: Farm[];
  mostWanted: string[];
  onOpenFarm: (farm: Farm) => void;
  onSelectCategory: (category: string) => void;
}

/**
 * Informational row under the hero: the nearest-farm locator and the
 * most-wanted products. (Seasonal produce and the coverage numbers live in
 * the hero's live panel.)
 */
export default function BentoOverview({
  farms,
  mostWanted,
  onOpenFarm,
  onSelectCategory,
}: BentoOverviewProps) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <Reveal className="mt-5 grid items-stretch gap-4 sm:grid-cols-[2fr_1fr]">
      <NearestFarmCard farms={farms} onOpenFarm={onOpenFarm} />

      <div className="glass glass-card flex min-h-[120px] flex-col justify-center gap-2 rounded-[22px] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
          {t("bento_mostWanted")}
        </p>
        {/* Tappable: each product filters the directory below. */}
        <div className="flex flex-wrap gap-1.5">
          {mostWanted.slice(0, 3).map((key) => (
            <button
              className="glass-chip rounded-full px-3 py-1.5 text-sm font-bold text-pine transition-colors hover:bg-pine/10 focus-visible:ring-2 focus-visible:ring-pine/40 active:scale-[0.97]"
              key={key}
              onClick={() => onSelectCategory(key)}
              type="button"
            >
              {tagLabel(key, locale)}
            </button>
          ))}
          {mostWanted.length === 0 ? (
            <p className="text-sm font-bold text-pine">—</p>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}
