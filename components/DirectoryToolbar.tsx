"use client";

import { useEffect, useRef } from "react";
import {
  ArrowDownWideNarrow,
  Heart,
  LayoutGrid,
  List,
  LoaderCircle,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { RADIUS_OPTIONS, type CategoryMatchMode } from "@/lib/directory";
import { getCantonName } from "@/lib/farms";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import type { DirectoryViewMode, FarmSortOption } from "@/types/farm";

interface DirectoryToolbarProps {
  activeFiltersCount: number;
  categoryOptions: string[];
  categoryCounts: Record<string, number>;
  cantonCounts: Record<string, number>;
  cantonRegions: { key: string; cantons: string[] }[];
  categoryMatchMode: CategoryMatchMode;
  isRefreshing: boolean;
  isLocating: boolean;
  locationActive: boolean;
  locationError: string | null;
  onCategoryMatchModeChange: (mode: CategoryMatchMode) => void;
  onClearCanton: () => void;
  onClearLocation: () => void;
  onClearSearchTerm: () => void;
  onCreateFarm: () => void;
  onRadiusChange: (km: number | null) => void;
  onRefresh: () => void;
  onReset: () => void;
  onSearchTermChange: (value: string) => void;
  onSelectedCantonChange: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onSortOptionChange: (value: FarmSortOption) => void;
  onToggleSavedOnly: () => void;
  onUseLocation: () => void;
  onViewModeChange: (value: DirectoryViewMode) => void;
  radiusKm: number | null;
  resultsCount: number;
  savedCount: number;
  searchTerm: string;
  selectedCanton: string;
  selectedCategories: string[];
  showSavedOnly: boolean;
  sortOption: FarmSortOption;
  totalCount: number;
  viewMode: DirectoryViewMode;
}

const fieldClassName =
  "w-full rounded-2xl border border-line bg-cloud px-4 py-3 text-sm font-medium text-ink transition duration-300 placeholder:text-ink/35 placeholder:font-normal focus:border-pine/50 focus:ring-4 focus:ring-pine/10";

const filterChipClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-tone px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20";

const viewToggleClassName = (isActive: boolean) =>
  `inline-flex flex-1 items-center justify-center rounded-xl px-3.5 py-2.5 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
    isActive
      ? "bg-ink text-cloud shadow-[0_4px_12px_-4px_rgba(20,22,27,0.5)]"
      : "text-ink/40 hover:text-ink/70"
  }`;

const segmentClassName = (isActive: boolean) =>
  `rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
    isActive ? "bg-ink text-cloud" : "text-ink/50 hover:text-ink/80"
  }`;

export default function DirectoryToolbar({
  activeFiltersCount,
  categoryOptions,
  categoryCounts,
  cantonCounts,
  cantonRegions,
  categoryMatchMode,
  isRefreshing,
  isLocating,
  locationActive,
  locationError,
  onCategoryMatchModeChange,
  onClearCanton,
  onClearLocation,
  onClearSearchTerm,
  onCreateFarm,
  onRadiusChange,
  onRefresh,
  onReset,
  onSearchTermChange,
  onSelectedCantonChange,
  onToggleCategory,
  onSortOptionChange,
  onToggleSavedOnly,
  onUseLocation,
  onViewModeChange,
  radiusKm,
  resultsCount,
  savedCount,
  searchTerm,
  selectedCanton,
  selectedCategories,
  showSavedOnly,
  sortOption,
  totalCount,
  viewMode,
}: DirectoryToolbarProps) {
  const t = useT();
  const { locale } = useLanguage();
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search field — unless the visitor is already typing in a
  // field or editing content elsewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section className="sticky top-[84px] z-20 rounded-[30px] border border-line bg-cloud/85 p-4 shadow-[0_1px_2px_rgba(20,22,27,0.04),0_28px_60px_-32px_rgba(20,22,27,0.28)] backdrop-blur-2xl sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-xl font-bold tracking-[-0.03em] text-ink">
          {t("toolbar_title")}
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-tone px-3 py-1.5 text-ink/70">
            {t("toolbar_shown", { n: resultsCount })}
          </span>
          <span className="rounded-full bg-tone px-3 py-1.5 text-ink/40">
            {t("toolbar_total", { n: totalCount })}
          </span>
          {activeFiltersCount > 0 ? (
            <span className="rounded-full bg-pine/10 px-3 py-1.5 text-pine">
              {t("toolbar_filters", { n: activeFiltersCount })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search farms</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            className={`${fieldClassName} pl-11 pr-10`}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={t("toolbar_searchPlaceholder")}
            ref={searchRef}
            value={searchTerm}
          />
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-tone px-1.5 py-0.5 text-[11px] font-semibold text-ink/40 sm:block"
          >
            /
          </kbd>
        </label>

        <label className="block">
          <span className="sr-only">Canton</span>
          <select
            className={fieldClassName}
            onChange={(event) => onSelectedCantonChange(event.target.value)}
            value={selectedCanton}
          >
            <option value="all">{t("toolbar_allCantons")}</option>
            {cantonRegions.map((region) => (
              <optgroup key={region.key} label={t(region.key)}>
                {region.cantons.map((canton) => (
                  <option key={canton} value={canton}>
                    {canton} · {getCantonName(canton)} (
                    {cantonCounts[canton] ?? 0})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="relative block">
          <span className="sr-only">Sort by</span>
          <ArrowDownWideNarrow className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <select
            className={`${fieldClassName} pl-11`}
            onChange={(event) =>
              onSortOptionChange(event.target.value as FarmSortOption)
            }
            value={sortOption}
          >
            <option value="newest">{t("sort_newest")}</option>
            {locationActive ? (
              <option value="nearest">{t("sort_nearest")}</option>
            ) : null}
            <option value="name">{t("sort_name")}</option>
            <option value="canton">{t("sort_canton")}</option>
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-2xl bg-tone p-1">
          <button
            aria-label="Show list layout"
            aria-pressed={viewMode === "list"}
            className={viewToggleClassName(viewMode === "list")}
            onClick={() => onViewModeChange("list")}
            type="button"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            aria-label="Show grid layout"
            aria-pressed={viewMode === "grid"}
            className={viewToggleClassName(viewMode === "grid")}
            onClick={() => onViewModeChange("grid")}
            type="button"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            aria-label="Show map layout"
            aria-pressed={viewMode === "map"}
            className={viewToggleClassName(viewMode === "map")}
            onClick={() => onViewModeChange("map")}
            type="button"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Location + radius — distance sorting and "within … of me". */}
      <div className="mt-3 flex flex-col gap-2.5 px-1 sm:flex-row sm:flex-wrap sm:items-center">
        {locationActive ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pine px-3 py-1.5 text-[13px] font-bold text-white">
              <Navigation className="h-3.5 w-3.5" />
              {t("chip_near")}
              <button
                aria-label={t("toolbar_clearLocation")}
                className="-mr-1 ml-0.5 rounded-full p-0.5 transition hover:bg-white/20"
                onClick={onClearLocation}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-full bg-tone p-1">
              {[null, ...RADIUS_OPTIONS].map((option) => (
                <button
                  aria-pressed={radiusKm === option}
                  className={segmentClassName(radiusKm === option)}
                  key={String(option)}
                  onClick={() => onRadiusChange(option)}
                  type="button"
                >
                  {option === null
                    ? t("toolbar_radiusAny")
                    : t("toolbar_radiusKm", { n: option })}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-4 py-2 text-[13px] font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-60"
            disabled={isLocating}
            onClick={onUseLocation}
            type="button"
          >
            {isLocating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 text-pine" />
            )}
            {isLocating ? t("nearest_locating") : t("toolbar_useLocation")}
          </button>
        )}
        {locationError ? (
          <span className="text-[13px] font-medium text-rose-600">
            {locationError}
          </span>
        ) : null}

        {savedCount > 0 || showSavedOnly ? (
          <button
            aria-pressed={showSavedOnly}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 sm:ml-auto ${
              showSavedOnly
                ? "border-pine/30 bg-pine/10 text-pine"
                : "border-line bg-cloud text-ink/70 hover:border-ink/25 hover:text-ink"
            }`}
            onClick={onToggleSavedOnly}
            type="button"
          >
            <Heart
              className={`h-4 w-4 ${showSavedOnly ? "fill-current" : ""}`}
            />
            {t("toolbar_savedOnly")}
            <span className={showSavedOnly ? "text-pine/60" : "text-ink/35"}>
              {savedCount}
            </span>
          </button>
        ) : null}
      </div>

      <div className="mt-3.5 flex flex-col gap-3 px-1 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categoryOptions.map((category) => {
            const isActive = selectedCategories.includes(category);
            const count = categoryCounts[category] ?? 0;

            // Contextually empty (given the other filters) and not chosen — dim
            // it so it's clear toggling it would yield nothing right now.
            const isEmpty = count === 0 && !isActive;

            return (
              <button
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  isActive
                    ? "border-ink bg-ink text-cloud shadow-[0_8px_20px_-8px_rgba(20,22,27,0.5)]"
                    : isEmpty
                      ? "border-line bg-cloud text-ink/30 hover:text-ink/50"
                      : "border-line bg-cloud text-ink/60 hover:border-ink/25 hover:text-ink"
                }`}
                key={category}
                onClick={() => onToggleCategory(category)}
                type="button"
              >
                {categoryLabel(category, locale)}
                <span className={isActive ? "text-cloud/55" : "text-ink/35"}>
                  {count}
                </span>
              </button>
            );
          })}

          {selectedCategories.length >= 2 ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-tone p-1">
              <button
                aria-pressed={categoryMatchMode === "all"}
                className={segmentClassName(categoryMatchMode === "all")}
                onClick={() => onCategoryMatchModeChange("all")}
                type="button"
              >
                {t("qs_match_all")}
              </button>
              <button
                aria-pressed={categoryMatchMode === "any"}
                className={segmentClassName(categoryMatchMode === "any")}
                onClick={() => onCategoryMatchModeChange("any")}
                type="button"
              >
                {t("qs_match_any")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-4 py-2 text-[13px] font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeFiltersCount === 0}
            onClick={onReset}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("toolbar_reset")}
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-4 py-2 text-[13px] font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? t("toolbar_refreshing") : t("toolbar_refresh")}
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-cloud shadow-[0_8px_20px_-8px_rgba(20,22,27,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            onClick={onCreateFarm}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("cta_addFarm")}
          </button>
        </div>
      </div>

      {activeFiltersCount > 0 ? (
        <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line px-1 pt-3.5">
          {searchTerm.trim() ? (
            <button
              className={filterChipClassName}
              onClick={onClearSearchTerm}
              type="button"
            >
              {t("chip_search")} {searchTerm.trim()}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {selectedCanton !== "all" ? (
            <button
              className={filterChipClassName}
              onClick={onClearCanton}
              type="button"
            >
              {t("chip_canton")} {getCantonName(selectedCanton)}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {selectedCategories.map((category) => (
            <button
              className={filterChipClassName}
              key={category}
              onClick={() => onToggleCategory(category)}
              type="button"
            >
              {t("chip_category")} {categoryLabel(category, locale)}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}

          {radiusKm !== null ? (
            <button
              className={filterChipClassName}
              onClick={() => onRadiusChange(null)}
              type="button"
            >
              {t("chip_radius", { n: radiusKm })}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
