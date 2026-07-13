"use client";

import Link from "@/components/i18n/LocalizedLink";
import { ArrowRight, Sparkles } from "lucide-react";
import CountUp from "@/components/motion/CountUp";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { SEASONAL_BY_MONTH, produceEmoji, produceLabel } from "@/lib/seasonal";
import type { Farm } from "@/types/farm";

interface HeroLivePanelProps {
  farms: Farm[];
  cantonCount: number;
  onOpenFarm: (farm: Farm) => void;
}

const IN_SEASON_LIMIT = 4;
const NEWEST_LIMIT = 3;

/**
 * The hero pane as a living dashboard: what's in season this month, the
 * newest farms in the directory, and the coverage numbers — real data, no
 * imagery. Everything links somewhere: chips to the seasonal calendar, farm
 * rows to their detail sheet.
 */
export default function HeroLivePanel({
  farms,
  cantonCount,
  onOpenFarm,
}: HeroLivePanelProps) {
  const t = useT();
  const { locale } = useLanguage();

  const month = new Date().getMonth();
  const monthItems = SEASONAL_BY_MONTH[month] ?? [];
  const inSeason = monthItems.slice(0, IN_SEASON_LIMIT);
  // The chips are a door, not a wall — surface how much more the calendar has.
  const extraCount = monthItems.length - inSeason.length;

  // Newest additions to the directory, most recent first.
  const newest = [...farms]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, NEWEST_LIMIT);

  return (
    <div className="glass hero-pane rise-in flex flex-col justify-between gap-5 rounded-[32px] p-6 sm:p-7">
      {/* Live header */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine-bright" />
          {t("hero_liveNow")}
        </p>
        <Sparkles className="h-4 w-4 text-pine/60" />
      </div>

      {/* In season this month */}
      <Link
        className="group -mx-2 rounded-2xl px-2 py-1 transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-ink/20"
        href="/seasonal"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
          {t("season_label")}
          <ArrowRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </p>
        <p className="mt-2 flex flex-wrap gap-1.5">
          {inSeason.map((key) => (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-cloud/80 px-2.5 py-1 text-xs font-semibold text-ink/80 ring-1 ring-inset ring-line"
              key={key}
            >
              <span aria-hidden>{produceEmoji(key)}</span>
              {produceLabel(key, locale)}
            </span>
          ))}
          {extraCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-pine/10 px-2.5 py-1 text-xs font-bold text-pine">
              +{extraCount}
            </span>
          ) : null}
        </p>
      </Link>

      {/* Newest farms */}
      {newest.length > 0 ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
            {t("hero_newestFarms")}
          </p>
          <ul className="mt-2 space-y-1">
            {newest.map((farm) => (
              <li key={farm.id}>
                <button
                  className="group flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-ink/20"
                  onClick={() => onOpenFarm(farm)}
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                    {farm.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-tone px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink/60">
                    {farm.canton}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Coverage footer */}
      <div className="flex items-end gap-6 border-t border-line/70 pt-4">
        <p className="flex flex-col">
          <span className="text-3xl font-black tracking-[-0.04em] text-ink">
            <CountUp value={farms.length} />
          </span>
          <span className="text-xs font-semibold text-ink/60">
            {t("bento_farmsListed")}
          </span>
        </p>
        <p className="flex flex-col">
          <span className="text-3xl font-black tracking-[-0.04em] text-ink">
            <CountUp value={cantonCount} />
          </span>
          <span className="text-xs font-semibold text-ink/60">
            {t("bento_cantonsCovered")}
          </span>
        </p>
      </div>
    </div>
  );
}
