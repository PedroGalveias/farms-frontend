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
}: BentoOverviewProps) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <Reveal className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:[grid-auto-rows:158px]">
      <NearestFarmCard farms={farms} onOpenFarm={onOpenFarm} />

      <div className="glass glass-card col-span-2 flex min-h-[120px] flex-col justify-center gap-2 rounded-[22px] px-5 py-4 sm:row-span-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
          {t("bento_mostWanted")}
        </p>
        <p className="text-sm font-bold leading-snug text-pine">
          {mostWanted
            .slice(0, 3)
            .map((key) => tagLabel(key, locale))
            .join(" · ") || "—"}
        </p>
      </div>
    </Reveal>
  );
}
