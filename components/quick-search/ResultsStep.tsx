"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Leaf, Map, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import CountUp from "@/components/motion/CountUp";
import NearestBurst from "@/components/quick-search/NearestBurst";
import { FavoriteButton } from "@/components/FarmCard";
import { localizedPath } from "@/lib/i18n-core";
import { productGroupOf, tagLabel } from "@/lib/products";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { getCantonName } from "@/lib/farms";
import {
  type QuickSearchLocation,
  type QuickSearchMatchMode,
  type QuickSearchResult,
} from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

function AnimatedDistance({ km }: { km: number }) {
  const t = useT();
  if (km < 1) {
    return <>{t("qs_dist_lt1")}</>;
  }

  const suffix = ` ${t("qs_dist_suffix")}`;
  if (km < 10) {
    return <CountUp decimals={1} durationMs={900} suffix={suffix} value={km} />;
  }

  return <CountUp durationMs={900} suffix={suffix} value={Math.round(km)} />;
}

const MAX_VISIBLE_CATEGORIES = 4;

// Render the result list incrementally. A broad search can match 800+ farms;
// mounting them all at once — each row a frosted glass pane — exhausts GPU
// memory on iOS Safari and crashes the tab. ~2 dozen rows fill any screen;
// more stream in as you approach the bottom.
const RESULTS_CHUNK = 24;

interface ResultsStepProps {
  location: QuickSearchLocation;
  matchMode: QuickSearchMatchMode;
  onEditProducts: () => void;
  onMatchModeChange: (mode: QuickSearchMatchMode) => void;
  onOpenFarm: (farm: Farm, sourceEl?: HTMLElement | null) => void;
  results: QuickSearchResult[];
  revealKey: number;
  selectedProducts: string[];
}

export default function ResultsStep({
  location,
  matchMode,
  onEditProducts,
  onMatchModeChange,
  onOpenFarm,
  results,
  revealKey,
  selectedProducts,
}: ResultsStepProps) {
  const { locale, t } = useLanguage();
  const count = results.length;

  const [visibleCount, setVisibleCount] = useState(RESULTS_CHUNK);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // The "nearest farm found" payoff (design §8): a one-shot ripple burst that
  // plays once per completed search that yields a result, then unmounts itself.
  const [showBurst, setShowBurst] = useState(false);

  // A new search (or re-entering the step) starts back at the first chunk.
  useEffect(() => {
    queueMicrotask(() => setVisibleCount(RESULTS_CHUNK));
  }, [revealKey, results]);

  // Fire the burst on a fresh search that actually found something. Keyed on
  // revealKey so it plays once per search, not on every chunk/scroll re-render;
  // deferred via microtask (matching the chunk-reset effect) so the state write
  // lands after commit rather than synchronously inside the effect.
  useEffect(() => {
    if (results.length === 0) return;
    queueMicrotask(() => setShowBurst(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  // Stream in the next chunk as the visitor nears the end of the list.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + RESULTS_CHUNK, results.length),
          );
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [results.length, visibleCount]);

  const hasCoordinates = location.coordinates !== null;
  const hasTypedLocation = !hasCoordinates && location.label.length > 0;

  const selectedGroups = [
    ...new Set(selectedProducts.map((key) => productGroupOf(key))),
  ];
  const mapParams = new URLSearchParams({ view: "map" });
  if (selectedGroups.length > 0) {
    mapParams.set("cat", selectedGroups.join(","));
  }
  const mapHref = localizedPath(`/?${mapParams.toString()}`, locale);

  const sortNote = hasCoordinates
    ? t("qs_res_nearest")
    : hasTypedLocation
      ? t("qs_res_best_for", { place: location.label })
      : t("qs_res_all_ch");

  return (
    <div className="space-y-4">
      <div className="relative">
        {showBurst ? (
          // Keyed on revealKey so a second search that lands while a burst is
          // still playing remounts it (replays) instead of being swallowed by
          // the already-true showBurst.
          <NearestBurst key={revealKey} onDone={() => setShowBurst(false)} />
        ) : null}
        <h2 className="text-xl font-bold tracking-[-0.035em] text-ink sm:text-[28px]">
          {count === 0
            ? t("qs_res_none_title")
            : count === 1
              ? t("qs_res_one_found")
              : t("qs_res_many_found", { n: count })}
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink/60">{sortNote}</p>
        {count > 0 && mapHref ? (
          <Link
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-chip border border-line bg-cloud px-3.5 py-1.5 text-xs font-bold text-ink/70 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            href={mapHref}
          >
            <Map className="h-3.5 w-3.5 text-pine" />
            {t("qs_see_on_map")}
          </Link>
        ) : null}
      </div>

      {count > 0 ? (
        <>
          <ul className="space-y-2.5" key={revealKey}>
            {results.slice(0, visibleCount).map((result, index) => (
              <ResultRow
                index={index}
                key={result.farm.id}
                onOpen={onOpenFarm}
                result={result}
                selectedProducts={selectedProducts}
              />
            ))}
          </ul>
          {visibleCount < count ? (
            <div aria-hidden className="h-px" ref={sentinelRef} />
          ) : null}
        </>
      ) : (
        <div className="rounded-card border border-dashed border-line bg-tone/40 px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-field bg-pine/10 text-pine">
            <Leaf className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-xl font-bold tracking-[-0.03em] text-ink">
            {t("qs_res_loosen_title")}
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/60">
            {matchMode === "all" && selectedProducts.length > 1
              ? t("qs_none_all_results")
              : t("qs_none_any")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {matchMode === "all" && selectedProducts.length > 1 ? (
              <button
                className="rounded-chip bg-ink px-5 py-2.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                onClick={() => onMatchModeChange("any")}
                type="button"
              >
                {t("qs_match_any_instead")}
              </button>
            ) : null}
            <button
              className="rounded-chip border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onEditProducts}
              type="button"
            >
              {t("qs_res_change_products")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({
  index,
  onOpen,
  result,
  selectedProducts,
}: {
  index: number;
  onOpen: (farm: Farm, sourceEl?: HTMLElement | null) => void;
  result: QuickSearchResult;
  selectedProducts: string[];
}) {
  const { locale, t } = useLanguage();
  const { farm } = result;
  const hasDistance = result.distanceKm !== null;

  const isCategoryMatched = (category: string) =>
    selectedProducts.includes(productGroupOf(category));

  const orderedCategories = [...farm.categories].sort(
    (left, right) =>
      Number(isCategoryMatched(right)) - Number(isCategoryMatched(left)),
  );
  const hiddenCategoryCount = orderedCategories.length - MAX_VISIBLE_CATEGORIES;

  return (
    <li
      className="qs-fade-up relative"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <FavoriteButton className="absolute right-2.5 top-2.5" farm={farm} />
      <button
        className="glass glass-card glass-interactive group w-full rounded-card p-3.5 text-left sm:p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-elev-3 focus-visible:ring-2 focus-visible:ring-ink/20"
        data-cursor="Open"
        onClick={(event) => onOpen(farm, event.currentTarget)}
        type="button"
      >
        <div className="flex items-center justify-between gap-3 pr-10">
          <p className="text-xs font-semibold text-ink/60">
            {farm.canton} · {getCantonName(farm.canton)}
          </p>
          {hasDistance ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-pine/10 px-2.5 py-1 text-xs font-bold text-pine">
              <Navigation className="h-3 w-3" />
              <AnimatedDistance km={result.distanceKm as number} />
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink/60" />
          )}
        </div>

        <h3 className="mt-2 text-lg font-bold leading-tight tracking-[-0.03em] text-ink">
          {farm.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/30" />
          {farm.address}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {orderedCategories
            .slice(0, MAX_VISIBLE_CATEGORIES)
            .map((category) => (
              <span
                className={`rounded-chip px-2.5 py-1 text-xs font-semibold ${
                  isCategoryMatched(category)
                    ? "bg-pine/10 text-pine"
                    : "bg-tone text-ink/70"
                }`}
                key={category}
              >
                {tagLabel(category, locale)}
              </span>
            ))}
          {hiddenCategoryCount > 0 ? (
            <span className="rounded-chip bg-tone px-2.5 py-1 text-xs font-semibold text-ink/70">
              {t("qs_res_more", { n: hiddenCategoryCount })}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
}
