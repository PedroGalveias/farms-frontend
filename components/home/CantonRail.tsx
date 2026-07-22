"use client";

import { useEffect, useRef } from "react";
import Link from "@/components/i18n/LocalizedLink";
import { ArrowRight, MapPin } from "lucide-react";
import { getCantonName } from "@/lib/farms";
import { haptic } from "@/lib/haptics";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Farm } from "@/types/farm";

/**
 * Canton quick-filter rail — a horizontally scrollable row of canton chips
 * directly under the directory toolbar, so browsing by canton is visible where
 * people search instead of buried at the bottom of the page. Tapping a chip
 * filters the directory in place (tap again to clear); "All cantons" opens the
 * canton hub with the full landing-page grid.
 *
 * Counts and order come from the full farm list (not the filtered facets) so
 * the rail stays stable while other filters change.
 */
export default function CantonRail({
  farms,
  selectedCanton,
  onSelectCanton,
}: {
  farms: Farm[];
  selectedCanton: string;
  onSelectCanton: (canton: string) => void;
}) {
  const t = useT();
  const railRef = useRef<HTMLDivElement | null>(null);

  const counts = new Map<string, number>();
  for (const farm of farms) {
    const code = farm.canton.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const cantons = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  // Keep the active chip in view when the canton arrives from the URL or the
  // toolbar select rather than a tap on the rail itself.
  useEffect(() => {
    if (selectedCanton === "all") return;
    const chip = railRef.current?.querySelector<HTMLElement>(
      `[data-canton="${selectedCanton}"]`,
    );
    chip?.scrollIntoView?.({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [selectedCanton]);

  if (cantons.length === 0) return null;

  return (
    <section aria-label={t("home_browseByCanton")} className="mt-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
          <MapPin className="h-3.5 w-3.5" />
          {t("home_browseByCanton")}
        </p>
        <Link
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-bold text-pine transition hover:text-ink"
          href="/canton"
        >
          {t("canton_allCantons")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div
        className="mt-2.5 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={railRef}
      >
        {cantons.map(([code, count]) => {
          const isActive = code === selectedCanton;
          return (
            <button
              aria-pressed={isActive}
              className={`glass-chip snap-start inline-flex shrink-0 items-center gap-1.5 rounded-chip px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 ${
                isActive
                  ? "!border-pine-surface !bg-pine-surface text-white shadow-[0_10px_24px_-10px_rgba(28,124,71,0.55)]"
                  : "text-ink/75 hover:text-ink"
              }`}
              data-canton={code}
              key={code}
              onClick={() => {
                haptic();
                onSelectCanton(isActive ? "all" : code);
              }}
              type="button"
            >
              {getCantonName(code)}
              <span
                className={`text-xs font-bold ${isActive ? "text-white/80" : "text-ink/50"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
