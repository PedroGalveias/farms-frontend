"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { PRODUCTS_BY_GROUP, productLabel } from "@/lib/products";
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
}

export default function ProductsStep({
  matchCount,
  matchMode,
  onClearSelection,
  onMatchModeChange,
  onToggleProduct,
  products,
  selectedProducts,
}: ProductsStepProps) {
  const { locale, t } = useLanguage();
  const selectedCount = selectedProducts.length;
  const hasAnyAvailability = products.some((product) => product.farmCount > 0);
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpanded = (group: string) =>
    setExpanded((current) =>
      current.includes(group)
        ? current.filter((value) => value !== group)
        : [...current, group],
    );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] font-bold tracking-[-0.035em] text-ink">
          {t("qs_prod_title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          {t("qs_prod_subcopy")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          aria-label="How selected products should match"
          className="inline-flex rounded-full bg-tone p-1"
          role="group"
        >
          {(["all", "any"] as const).map((mode) => (
            <button
              aria-pressed={matchMode === mode}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 ${
                matchMode === mode
                  ? "bg-white text-ink shadow-[0_1px_3px_rgba(22,26,21,0.12)]"
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

      <div className="space-y-2">
        {products.map((product) => {
          const group = product.category;
          const isSelected = selectedProducts.includes(group);
          const isUnavailable = hasAnyAvailability && product.farmCount === 0;
          const subProducts = PRODUCTS_BY_GROUP[group] ?? [];
          const isOpen = expanded.includes(group);
          const selectedSubCount = subProducts.filter((key) =>
            selectedProducts.includes(key),
          ).length;

          return (
            <div
              className="overflow-hidden rounded-2xl border border-line bg-cloud"
              key={group}
            >
              <div className="flex items-stretch gap-1 p-1">
                <button
                  aria-pressed={isSelected}
                  className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    isSelected
                      ? "bg-ink text-cloud"
                      : `text-ink/75 hover:bg-tone ${
                          isUnavailable ? "opacity-45" : ""
                        }`
                  }`}
                  onClick={() => onToggleProduct(group)}
                  type="button"
                >
                  {isSelected ? (
                    <Check className="check-pop h-3.5 w-3.5" />
                  ) : (
                    <span aria-hidden="true">{categoryEmoji(group)}</span>
                  )}
                  {categoryLabel(group, locale)}
                  {product.farmCount > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-none ${
                        isSelected
                          ? "bg-cloud/20 text-cloud"
                          : "bg-tone text-ink/60"
                      }`}
                    >
                      {product.farmCount}
                    </span>
                  ) : null}
                  {!isSelected && selectedSubCount > 0 ? (
                    <span className="rounded-full bg-pine/10 px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-pine">
                      {selectedSubCount}
                    </span>
                  ) : null}
                </button>

                {subProducts.length > 0 ? (
                  <button
                    aria-expanded={isOpen}
                    aria-label={t("qs_show_products")}
                    className="grid w-10 shrink-0 place-items-center rounded-xl text-ink/60 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
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

              {isOpen && subProducts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-3">
                  {subProducts.map((key) => {
                    const isProductSelected = selectedProducts.includes(key);
                    return (
                      <button
                        aria-pressed={isProductSelected}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
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
            </div>
          );
        })}
      </div>

      {matchCount === 0 && selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-6 text-amber-900">
            {matchMode === "all" && selectedCount > 1
              ? t("qs_none_all")
              : t("qs_none_any")}
          </p>
          {matchMode === "all" && selectedCount > 1 ? (
            <button
              className="rounded-full bg-amber-200/70 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400"
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
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
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
