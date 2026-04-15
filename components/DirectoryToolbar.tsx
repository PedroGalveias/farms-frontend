import {
  ArrowDownWideNarrow,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getCantonName } from "@/lib/farms";
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
  "mt-2 w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-ink shadow-[0_12px_28px_rgba(31,42,33,0.06)] transition placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/20";

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
  return (
    <section className="sticky top-4 z-20 rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,245,234,0.96))] p-5 shadow-[0_28px_70px_rgba(31,42,33,0.1)] backdrop-blur sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-meadow/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-forest">
            <SlidersHorizontal className="h-4 w-4" />
            Search farms quickly
          </div>
          <div>
            <h2 className="text-3xl leading-none text-forest sm:text-[2.2rem]">
              Find the right farm in a few seconds
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
              Start with a broad search, then refine with canton and category
              filters. Everything here is built around fast scanning and quick
              narrowing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70">
          <span className="rounded-full bg-forest/8 px-3 py-2 font-semibold text-forest">
            {resultsCount} shown
          </span>
          <span className="rounded-full bg-sun/25 px-3 py-2 font-medium text-forest">
            {totalCount} total
          </span>
          <span className="rounded-full bg-sky/25 px-3 py-2 font-medium text-forest">
            {activeFiltersCount > 0
              ? `${activeFiltersCount} filters active`
              : "No filters applied"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.9fr_1fr_1fr_auto_auto]">
        <label className="relative block">
          <span className="text-sm font-semibold text-forest">Search farms</span>
          <Search className="pointer-events-none absolute left-5 top-[3.2rem] h-5 w-5 text-ink/35" />
          <input
            className={`${fieldClassName} min-h-14 pl-[3.25rem] text-base`}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search by farm name, address, or produce"
            value={searchTerm}
          />
          <p className="mt-2 text-sm text-ink/56">
            Try produce names, locations, or part of a farm name.
          </p>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-forest">Canton</span>
          <select
            className={fieldClassName}
            onChange={(event) => onSelectedCantonChange(event.target.value)}
            value={selectedCanton}
          >
            <option value="all">All cantons</option>
            {cantonOptions.map((canton) => (
              <option key={canton} value={canton}>
                {canton} · {getCantonName(canton)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-forest">Category</span>
          <select
            className={fieldClassName}
            onChange={(event) => onSelectedCategoryChange(event.target.value)}
            value={selectedCategory}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-forest">Sort by</span>
          <div className="relative">
            <ArrowDownWideNarrow className="pointer-events-none absolute left-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <select
              className={`${fieldClassName} pl-10`}
              onChange={(event) =>
                onSortOptionChange(event.target.value as FarmSortOption)
              }
              value={sortOption}
            >
              <option value="newest">Newest first</option>
              <option value="name">Farm name</option>
              <option value="canton">Canton</option>
            </select>
          </div>
        </label>

        <div className="flex items-end">
          <div className="flex min-h-14 w-full items-center gap-1 rounded-2xl border border-border bg-white/70 p-1 shadow-[0_12px_28px_rgba(31,42,33,0.06)]">
            <button
              aria-label="Show list layout"
              aria-pressed={viewMode === "list"}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                viewMode === "list"
                  ? "bg-forest text-white"
                  : "text-ink/72 hover:bg-forest/5"
              }`}
              onClick={() => onViewModeChange("list")}
              type="button"
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              aria-label="Show grid layout"
              aria-pressed={viewMode === "grid"}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                viewMode === "grid"
                  ? "bg-forest text-white"
                  : "text-ink/72 hover:bg-forest/5"
              }`}
              onClick={() => onViewModeChange("grid")}
              type="button"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {quickCategories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-forest text-white shadow-[0_12px_30px_rgba(31,77,59,0.2)]"
                    : "bg-meadow/14 text-forest hover:bg-meadow/22"
                }`}
                key={category}
                onClick={() => onSelectQuickCategory(category)}
                type="button"
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white/70 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-forest/5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={activeFiltersCount === 0}
            onClick={onReset}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-muted disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c26e33]"
            onClick={onCreateFarm}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add a farm
          </button>
        </div>
      </div>

      {activeFiltersCount > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm.trim() ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-forest transition hover:bg-[#ebc99c]"
              onClick={onClearSearchTerm}
              type="button"
            >
              Search: {searchTerm.trim()}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {selectedCanton !== "all" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-sky/28 px-3 py-2 text-sm font-medium text-forest transition hover:bg-sky/36"
              onClick={onClearCanton}
              type="button"
            >
              Canton: {getCantonName(selectedCanton)}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {selectedCategory !== "all" ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-meadow/18 px-3 py-2 text-sm font-medium text-forest transition hover:bg-meadow/26"
              onClick={onClearCategory}
              type="button"
            >
              Category: {selectedCategory}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
