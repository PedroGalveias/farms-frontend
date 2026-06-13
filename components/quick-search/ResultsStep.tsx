"use client";

import { ChevronRight, Leaf, MapPin, Navigation } from "lucide-react";
import { getCantonName } from "@/lib/farms";
import {
  formatQuickSearchDistance,
  productMatchesCategory,
  type QuickSearchLocation,
  type QuickSearchMatchMode,
  type QuickSearchResult,
} from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

const MAX_VISIBLE_CATEGORIES = 4;

interface ResultsStepProps {
  location: QuickSearchLocation;
  matchMode: QuickSearchMatchMode;
  onEditProducts: () => void;
  onMatchModeChange: (mode: QuickSearchMatchMode) => void;
  onOpenFarm: (farm: Farm) => void;
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
  const count = results.length;
  const hasCoordinates = location.coordinates !== null;
  const hasTypedLocation = !hasCoordinates && location.label.length > 0;

  const sortNote = hasCoordinates
    ? "Nearest first. Tap a farm for details."
    : hasTypedLocation
      ? `Best matches for “${location.label}” first. Tap a farm for details.`
      : "From all of Switzerland. Tap a farm for details.";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[28px] font-bold tracking-[-0.035em] text-ink">
          {count === 0
            ? "No farms found"
            : count === 1
              ? "1 farm found"
              : `${count} farms found`}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/55">{sortNote}</p>
      </div>

      {count > 0 ? (
        <ul className="space-y-2.5" key={revealKey}>
          {results.map((result, index) => (
            <ResultRow
              index={index}
              key={result.farm.id}
              onOpen={onOpenFarm}
              result={result}
              selectedProducts={selectedProducts}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-[24px] border border-dashed border-line bg-tone/40 px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pine/10 text-pine">
            <Leaf className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-xl font-bold tracking-[-0.03em] text-ink">
            Try loosening your search
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/55">
            {matchMode === "all" && selectedProducts.length > 1
              ? "No single farm offers all of those products together."
              : "No farms carry these products right now."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {matchMode === "all" && selectedProducts.length > 1 ? (
              <button
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                onClick={() => onMatchModeChange("any")}
                type="button"
              >
                Match any product instead
              </button>
            ) : null}
            <button
              className="rounded-full border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onEditProducts}
              type="button"
            >
              Change products
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
  onOpen: (farm: Farm) => void;
  result: QuickSearchResult;
  selectedProducts: string[];
}) {
  const { farm } = result;
  const distanceLabel = formatQuickSearchDistance(result.distanceKm);

  const isCategoryMatched = (category: string) =>
    selectedProducts.some((product) =>
      productMatchesCategory(product, category),
    );

  const orderedCategories = [...farm.categories].sort(
    (left, right) =>
      Number(isCategoryMatched(right)) - Number(isCategoryMatched(left)),
  );
  const hiddenCategoryCount = orderedCategories.length - MAX_VISIBLE_CATEGORIES;

  return (
    <li
      className="qs-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <button
        className="group w-full rounded-[20px] border border-line bg-cloud p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_18px_36px_-16px_rgba(20,22,27,0.28)] focus-visible:ring-2 focus-visible:ring-ink/20"
        onClick={() => onOpen(farm)}
        type="button"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-ink/40">
            {farm.canton} · {getCantonName(farm.canton)}
          </p>
          {distanceLabel ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-xs font-bold text-pine">
              <Navigation className="h-3 w-3" />
              {distanceLabel}
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-ink/50" />
          )}
        </div>

        <h3 className="mt-2 text-lg font-bold leading-tight tracking-[-0.03em] text-ink">
          {farm.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/55">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/30" />
          {farm.address}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {orderedCategories
            .slice(0, MAX_VISIBLE_CATEGORIES)
            .map((category) => (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isCategoryMatched(category)
                    ? "bg-pine/10 text-pine"
                    : "bg-tone text-ink/55"
                }`}
                key={category}
              >
                {category}
              </span>
            ))}
          {hiddenCategoryCount > 0 ? (
            <span className="rounded-full bg-tone px-2.5 py-1 text-xs font-semibold text-ink/40">
              +{hiddenCategoryCount} more
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
}
