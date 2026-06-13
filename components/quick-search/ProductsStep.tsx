"use client";

import { Check, X } from "lucide-react";
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
  const selectedCount = selectedProducts.length;
  const hasAnyAvailability = products.some((product) => product.farmCount > 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] font-bold tracking-[-0.035em] text-ink">
          What do you need?
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/55">
          Pick one or more products — the numbers show how many farms carry
          each.
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
                  : "text-ink/45 hover:text-ink/70"
              }`}
              key={mode}
              onClick={() => onMatchModeChange(mode)}
              type="button"
            >
              {mode === "all" ? "Match all" : "Match any"}
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-ink/45">
          {matchMode === "all"
            ? "Farms must offer everything you pick."
            : "Farms can offer any of your picks."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {products.map((product) => {
          const isSelected = selectedProducts.includes(product.label);
          const isUnavailable = hasAnyAvailability && product.farmCount === 0;

          return (
            <button
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                isSelected
                  ? "border-ink bg-ink text-cloud shadow-[0_8px_20px_-8px_rgba(20,22,27,0.5)]"
                  : `border-line bg-cloud text-ink/75 hover:border-ink/30 hover:text-ink ${
                      isUnavailable ? "opacity-45" : ""
                    }`
              }`}
              key={product.label}
              onClick={() => onToggleProduct(product.label)}
              type="button"
            >
              {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
              {product.label}
              {product.farmCount > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-none ${
                    isSelected
                      ? "bg-cloud/20 text-cloud"
                      : "bg-tone text-ink/50"
                  }`}
                >
                  {product.farmCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {matchCount === 0 && selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-6 text-amber-900">
            {matchMode === "all" && selectedCount > 1
              ? "No farm has all of these together."
              : "No farms carry these products right now."}
          </p>
          {matchMode === "all" && selectedCount > 1 ? (
            <button
              className="rounded-full bg-amber-200/70 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => onMatchModeChange("any")}
              type="button"
            >
              Match any instead
            </button>
          ) : null}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <button
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink/45 transition hover:bg-tone hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
          onClick={onClearSelection}
          type="button"
        >
          <X className="h-3 w-3" />
          Clear selection ({selectedCount})
        </button>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {selectedCount === 0
          ? "No products selected."
          : `${matchCount} ${matchCount === 1 ? "farm matches" : "farms match"} your selection.`}
      </p>
    </div>
  );
}
