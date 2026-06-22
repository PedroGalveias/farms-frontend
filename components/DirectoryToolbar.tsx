"use client";

import {
  ArrowDownWideNarrow,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { getCantonName } from "@/lib/farms";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import type { DirectoryViewMode, FarmSortOption } from "@/types/farm";

interface DirectoryToolbarProps {
  activeFiltersCount: number;
  categoryOptions: string[];
  cantonOptions: string[];
  isRefreshing: boolean;
  onClearCanton: () => void;
  onClearCategory: () => void;
  onClearSearchTerm: () => void;
  onCreateFarm: () => void;
  onRefresh: () => void;
  onReset: () => void;
  onSelectQuickCategory: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onSelectedCantonChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onSortOptionChange: (value: FarmSortOption) => void;
  onViewModeChange: (value: DirectoryViewMode) => void;
  quickCategories: string[];
  resultsCount: number;
  searchTerm: string;
  selectedCanton: string;
  selectedCategory: string;
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

export default function DirectoryToolbar({
  activeFiltersCount,
  categoryOptions,
  cantonOptions,
  isRefreshing,
  onClearCanton,
  onClearCategory,
  onClearSearchTerm,
  onCreateFarm,
  onRefresh,
  onReset,
  onSelectQuickCategory,
  onSearchTermChange,
  onSelectedCantonChange,
  onSelectedCategoryChange,
  onSortOptionChange,
  onViewModeChange,
  quickCategories,
  resultsCount,
  searchTerm,
  selectedCanton,
  selectedCategory,
  sortOption,
  totalCount,
  viewMode,
}: DirectoryToolbarProps) {
  const t = useT();
  const { locale } = useLanguage();

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

      <div className="mt-4 grid gap-2.5 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search farms</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            className={`${fieldClassName} pl-11`}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={t("toolbar_searchPlaceholder")}
            value={searchTerm}
          />
        </label>

        <label className="block">
          <span className="sr-only">Canton</span>
          <select
            className={fieldClassName}
            onChange={(event) => onSelectedCantonChange(event.target.value)}
            value={selectedCanton}
          >
            <option value="all">{t("toolbar_allCantons")}</option>
            {cantonOptions.map((canton) => (
              <option key={canton} value={canton}>
                {canton} · {getCantonName(canton)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Category</span>
          <select
            className={fieldClassName}
            onChange={(event) => onSelectedCategoryChange(event.target.value)}
            value={selectedCategory}
          >
            <option value="all">{t("toolbar_allCategories")}</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category, locale)}
              </option>
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

      <div className="mt-3.5 flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {quickCategories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                aria-pressed={isActive}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  isActive
                    ? "border-ink bg-ink text-cloud shadow-[0_8px_20px_-8px_rgba(20,22,27,0.5)]"
                    : "border-line bg-cloud text-ink/60 hover:border-ink/25 hover:text-ink"
                }`}
                key={category}
                onClick={() => onSelectQuickCategory(category)}
                type="button"
              >
                {categoryLabel(category, locale)}
              </button>
            );
          })}
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

          {selectedCategory !== "all" ? (
            <button
              className={filterChipClassName}
              onClick={onClearCategory}
              type="button"
            >
              {t("chip_category")} {categoryLabel(selectedCategory, locale)}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
