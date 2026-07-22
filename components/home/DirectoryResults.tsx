"use client";

import dynamic from "next/dynamic";
import { MapPin, Plus } from "lucide-react";
import FarmCard from "@/components/FarmCard";
import MapPlaceholder from "@/components/MapPlaceholder";
import Reveal from "@/components/motion/Reveal";
import { useT } from "@/components/i18n/LanguageProvider";
import { PAGE_SIZE } from "@/components/home/useFarmDirectory";
import type { DirectoryViewMode, Farm } from "@/types/farm";

// Leaflet touches `window`/`document` at import time, so load it client-only and
// keep it out of the initial bundle until the map view is opened.
const FarmsMap = dynamic(() => import("@/components/FarmsMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

interface DirectoryResultsProps {
  visibleFarms: Farm[];
  totalFarmCount: number;
  viewMode: DirectoryViewMode;
  visibleCount: number;
  distanceByFarmId: Map<string, number | null>;
  onOpenFarm: (farm: Farm, sourceEl?: HTMLElement | null) => void;
  onLongPressFarm: (farm: Farm) => void;
  onLoadMore: () => void;
  onAddFarm: () => void;
  onResetFilters: () => void;
}

export default function DirectoryResults({
  visibleFarms,
  totalFarmCount,
  viewMode,
  visibleCount,
  distanceByFarmId,
  onOpenFarm,
  onLongPressFarm,
  onLoadMore,
  onAddFarm,
  onResetFilters,
}: DirectoryResultsProps) {
  const t = useT();

  if (visibleFarms.length === 0) {
    return (
      <section className="mt-8 rounded-panel border border-dashed border-line bg-tone/40 px-6 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-field bg-pine/10 text-pine">
            <MapPin className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-ink">
            {totalFarmCount === 0
              ? t("empty_noneAvailable")
              : t("empty_noneMatch")}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-ink/60">
            {totalFarmCount === 0
              ? t("empty_noneAvailableSub")
              : t("empty_noneMatchSub")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {totalFarmCount === 0 ? (
              <button
                className="inline-flex items-center gap-2 rounded-chip bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                onClick={onAddFarm}
                type="button"
              >
                <Plus className="h-4 w-4" />
                {t("empty_addFirst")}
              </button>
            ) : (
              <button
                className="rounded-chip border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                onClick={onResetFilters}
                type="button"
              >
                {t("empty_clearFilters")}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-[-0.035em] text-ink">
          {t("results_farms", { n: visibleFarms.length })}
        </h2>
        <p className="text-sm text-ink/60">
          {viewMode !== "map" && visibleCount < visibleFarms.length
            ? t("results_showing", {
                shown: visibleCount,
                total: visibleFarms.length,
              })
            : t("results_updateAsYouType")}
        </p>
      </div>

      {viewMode === "map" ? (
        <div className="mt-6">
          <FarmsMap farms={visibleFarms} onOpenFarm={onOpenFarm} />
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                : "mt-6 flex flex-col gap-3"
            }
          >
            {visibleFarms.slice(0, visibleCount).map((farm, index) => (
              <Reveal
                delay={Math.min(index % PAGE_SIZE, 6) * 60}
                key={farm.id}
                style={{
                  height: viewMode === "grid" ? "100%" : undefined,
                }}
              >
                <FarmCard
                  distanceKm={distanceByFarmId.get(farm.id) ?? null}
                  farm={farm}
                  onLongPress={onLongPressFarm}
                  onOpen={(sourceEl) => onOpenFarm(farm, sourceEl)}
                  variant={viewMode}
                />
              </Reveal>
            ))}
          </div>

          {visibleCount < visibleFarms.length ? (
            <div className="mt-10 flex justify-center">
              <button
                className="inline-flex items-center gap-2 rounded-chip border border-line bg-cloud px-7 py-3.5 text-sm font-semibold text-ink/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20"
                onClick={onLoadMore}
                type="button"
              >
                {t("results_loadMore")}
                <span className="text-ink/60">
                  {t("results_left", {
                    n: visibleFarms.length - visibleCount,
                  })}
                </span>
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
