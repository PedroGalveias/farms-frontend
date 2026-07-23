"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { PRODUCTS_BY_GROUP, productLabel, tagLabel } from "@/lib/products";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type {
  QuickSearchMatchMode,
  QuickSearchProduct,
} from "@/lib/quick-search";

interface ProductsStepProps {
  matchCount: number;
  matchMode: QuickSearchMatchMode;
  onClearSelection: () => void;
  onMatchModeChange: (mode: QuickSearchMatchMode) => void;
  onToggleProduct: (product: string) => void;
  products: QuickSearchProduct[];
  selectedProducts: string[];
  starterKeys: string[];
}

export default function ProductsStep({
  matchCount,
  matchMode,
  onClearSelection,
  onMatchModeChange,
  onToggleProduct,
  products,
  selectedProducts,
  starterKeys,
}: ProductsStepProps) {
  const { locale, t } = useLanguage();
  const selectedCount = selectedProducts.length;
  const hasAnyAvailability = products.some((product) => product.farmCount > 0);
  // Single-open accordion (design §9): opening one group closes the other.
  // Multiple open panels used to stretch whole grid rows — the neighbouring
  // tile collapsed to a chip above a tall empty cell and panels overlapped.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const gridRef = useRef<HTMLDivElement | null>(null);

  const toggleExpanded = (group: string) =>
    setExpanded((current) => (current === group ? null : group));

  // Type-to-filter: a group stays visible when its own label matches OR any
  // of its products match; groups that match only through a product
  // auto-expand so the hit is on screen. 183 products across 13 groups is
  // too much taxonomy to browse when you already know the word.
  const query = filter.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) {
      return { matchedSubs: new Set<string>(), visible: products };
    }
    const visible: QuickSearchProduct[] = [];
    const matchedSubs = new Set<string>();
    for (const product of products) {
      const group = product.category;
      const groupHit = categoryLabel(group, locale)
        .toLowerCase()
        .includes(query);
      const subHits = (PRODUCTS_BY_GROUP[group] ?? []).filter((key) =>
        productLabel(key, locale).toLowerCase().includes(query),
      );
      if (groupHit || subHits.length > 0) {
        visible.push(product);
        for (const key of subHits) {
          matchedSubs.add(key);
        }
      }
    }
    return { matchedSubs, visible };
  }, [locale, products, query]);

  const isFiltering = query.length > 0;

  // Keyboard flow (desktop): arrows move across the category grid without
  // tabbing through every chevron.
  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(event.key)) {
      return;
    }
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const toggles = [
      ...grid.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
    ];
    const index = toggles.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) {
      return;
    }
    event.preventDefault();
    const columns = window.innerWidth >= 640 ? 2 : 1;
    const delta =
      event.key === "ArrowDown"
        ? columns
        : event.key === "ArrowUp"
          ? -columns
          : event.key === "ArrowRight"
            ? 1
            : -1;
    toggles[Math.min(Math.max(index + delta, 0), toggles.length - 1)]?.focus();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-[-0.035em] text-ink sm:text-[28px]">
          {t("qs_prod_title")}
        </h2>
        <p className="mt-1.5 hidden text-sm leading-6 text-ink/60 sm:block">
          {t("qs_prod_subcopy")}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          className="w-full rounded-field border border-line bg-cloud py-2.5 pl-10 pr-9 text-base text-ink placeholder:text-ink/40 focus:border-pine/50 focus:outline-none focus:ring-2 focus:ring-pine/15 sm:text-sm"
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t("qs_filter_placeholder")}
          type="search"
          value={filter}
        />
        {isFiltering ? (
          <button
            aria-label={t("qs_filter_clear")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-chip p-1.5 text-ink/50 transition hover:bg-tone hover:text-ink"
            onClick={() => setFilter("")}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {!isFiltering && starterKeys.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
            {t("qs_starters_label")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {starterKeys.map((key) => {
              const isSelected = selectedProducts.includes(key);
              return (
                <button
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    isSelected
                      ? "border-pine bg-pine/10 text-pine"
                      : "border-line bg-cloud text-ink/65 hover:border-ink/25 hover:text-ink"
                  }`}
                  key={key}
                  onClick={() => onToggleProduct(key)}
                  type="button"
                >
                  {isSelected ? <Check className="h-3 w-3" /> : null}
                  {tagLabel(key, locale)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div
          aria-label="How selected products should match"
          className="inline-flex rounded-chip bg-tone p-1"
          role="group"
        >
          {(["all", "any"] as const).map((mode) => (
            <button
              aria-pressed={matchMode === mode}
              className={`rounded-chip px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 ${
                matchMode === mode
                  ? "bg-white text-ink shadow-elev-1"
                  : "text-ink/60 hover:text-ink/70"
              }`}
              key={mode}
              onClick={() => onMatchModeChange(mode)}
              type="button"
            >
              {mode === "all" ? t("qs_match_all") : t("qs_match_any")}
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-ink/60">
          {matchMode === "all"
            ? t("qs_match_all_hint")
            : t("qs_match_any_hint")}
        </p>
      </div>

      {/* Two columns from sm up — twice the catalog visible per screen.
          `grid-flow-dense` backfills the cell an open panel vacates, so the
          neighbouring tile never floats above an empty stretch (design §9). */}
      <div
        className="grid grid-flow-dense grid-cols-1 gap-2 sm:grid-cols-2"
        onKeyDown={handleGridKeyDown}
        ref={gridRef}
      >
        {filtered.visible.map((product) => {
          const group = product.category;
          const isSelected = selectedProducts.includes(group);
          const isUnavailable = hasAnyAvailability && product.farmCount === 0;
          const allSubs = PRODUCTS_BY_GROUP[group] ?? [];
          const subProducts = isFiltering
            ? allSubs.filter((key) => filtered.matchedSubs.has(key))
            : allSubs;
          const isOpen = isFiltering
            ? subProducts.length > 0
            : expanded === group;
          const selectedSubCount = allSubs.filter((key) =>
            selectedProducts.includes(key),
          ).length;

          // The tile and its expanded product list are SIBLING grid items:
          // the panel spans the full row below the tiles (col-span-full),
          // never inside a 2-col cell — an open panel used to stretch its
          // whole grid row and overlap the next one (design §9 bug).
          return (
            <Fragment key={group}>
              <div className="glass glass-card overflow-hidden rounded-field">
                <div className="flex items-stretch gap-1 p-1">
                  <button
                    aria-pressed={isSelected}
                    className={`flex flex-1 items-center gap-2 rounded-field px-3 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                      isSelected
                        ? "bg-ink text-cloud"
                        : `text-ink/75 hover:bg-tone ${
                            isUnavailable ? "opacity-45" : ""
                          }`
                    }`}
                    onClick={() => onToggleProduct(group)}
                    type="button"
                  >
                    {/* icon · label · badges — the label owns the flexible
                        space and clamps, so the count badge sits right-aligned
                        after it instead of breaking the phrase mid-word. */}
                    {isSelected ? (
                      <Check className="check-pop h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <span aria-hidden="true" className="shrink-0">
                        {categoryEmoji(group)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-left">
                      {categoryLabel(group, locale)}
                    </span>
                    {product.farmCount > 0 ? (
                      <span
                        className={`shrink-0 rounded-chip px-1.5 py-0.5 text-[0.65rem] font-bold leading-none tabular-nums ${
                          isSelected
                            ? "bg-cloud/20 text-cloud"
                            : "bg-tone text-ink/60"
                        }`}
                      >
                        {product.farmCount}
                      </span>
                    ) : null}
                    {!isSelected && selectedSubCount > 0 ? (
                      <span className="shrink-0 rounded-chip bg-pine/10 px-1.5 py-0.5 text-[0.65rem] font-bold leading-none tabular-nums text-pine">
                        {selectedSubCount}
                      </span>
                    ) : null}
                  </button>

                  {allSubs.length > 0 && !isFiltering ? (
                    <button
                      aria-expanded={isOpen}
                      aria-label={t("qs_show_products")}
                      className="grid w-10 shrink-0 place-items-center rounded-field text-ink/60 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                      onClick={() => toggleExpanded(group)}
                      type="button"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : null}
                </div>
              </div>

              {isOpen && subProducts.length > 0 ? (
                <div className="glass glass-card col-span-full flex flex-wrap gap-1.5 rounded-field px-3 py-3">
                  {subProducts.map((key) => {
                    const isProductSelected = selectedProducts.includes(key);
                    return (
                      <button
                        aria-pressed={isProductSelected}
                        className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                          isProductSelected
                            ? "border-pine bg-pine/10 text-pine"
                            : "border-line bg-cloud text-ink/65 hover:border-ink/25 hover:text-ink"
                        }`}
                        key={key}
                        onClick={() => onToggleProduct(key)}
                        type="button"
                      >
                        {isProductSelected ? (
                          <Check className="h-3 w-3" />
                        ) : null}
                        {productLabel(key, locale)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>

      {isFiltering && filtered.visible.length === 0 ? (
        <p className="rounded-field border border-dashed border-line bg-tone/40 px-4 py-6 text-center text-sm leading-6 text-ink/60">
          {t("qs_filter_no_matches", { query: filter.trim() })}
        </p>
      ) : null}

      {matchCount === 0 && selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-field border border-amber-300/60 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-6 text-amber-900">
            {matchMode === "all" && selectedCount > 1
              ? t("qs_none_all")
              : t("qs_none_any")}
          </p>
          {matchMode === "all" && selectedCount > 1 ? (
            <button
              className="rounded-chip bg-amber-200/70 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => onMatchModeChange("any")}
              type="button"
            >
              {t("qs_match_any_instead")}
            </button>
          ) : null}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <button
          className="inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
          onClick={onClearSelection}
          type="button"
        >
          <X className="h-3 w-3" />
          {t("qs_clear_selection", { n: selectedCount })}
        </button>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {selectedCount === 0
          ? t("qs_sr_none")
          : t(matchCount === 1 ? "qs_sr_matches_one" : "qs_sr_matches_many", {
              n: matchCount,
            })}
      </p>
    </div>
  );
}
