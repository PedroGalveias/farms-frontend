"use client";

import { Egg } from "lucide-react";
import NearestFarmCard from "@/components/NearestFarmCard";
import SeasonalCard from "@/components/SeasonalCard";
import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/motion/Reveal";
import ImageSlot from "@/components/home/ImageSlot";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { tagLabel } from "@/lib/products";
import type { Farm } from "@/types/farm";

interface BentoOverviewProps {
  farms: Farm[];
  cantonCount: number;
  mostWanted: string[];
  onOpenFarm: (farm: Farm) => void;
}

/** Informational bento grid: seasonal, totals, nearest farm, most-wanted. */
export default function BentoOverview({
  farms,
  cantonCount,
  mostWanted,
  onOpenFarm,
}: BentoOverviewProps) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <Reveal className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:[grid-auto-rows:158px]">
      <SeasonalCard />

      <div className="flex flex-col justify-center rounded-[22px] bg-tone px-5 py-4">
        <p className="text-4xl font-black tracking-[-0.04em] text-ink">
          <CountUp value={farms.length} />
        </p>
        <p className="mt-1 text-xs font-semibold text-ink/70">
          {t("bento_farmsListed")}
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-[22px] bg-tone px-5 py-4">
        <p className="text-4xl font-black tracking-[-0.04em] text-ink">
          <CountUp value={cantonCount} />
        </p>
        <p className="mt-1 text-xs font-semibold text-ink/70">
          {t("bento_cantonsCovered")}
        </p>
      </div>

      <NearestFarmCard farms={farms} onOpenFarm={onOpenFarm} />

      <ImageSlot
        className="min-h-[150px] rounded-[22px] sm:min-h-0"
        icon={Egg}
        label={t("bento_eggsDairy")}
      />

      <div className="glass flex flex-col justify-center gap-2 rounded-[22px] px-5 py-4">
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
