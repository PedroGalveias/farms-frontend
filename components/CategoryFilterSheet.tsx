"use client";

import { useId } from "react";
import { Check, RotateCcw } from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { categoryLabel } from "@/lib/categories";
import type { CategoryMatchMode } from "@/lib/directory";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";

interface CategoryFilterSheetProps {
  categoryOptions: string[];
  categoryCounts: Record<string, number>;
  selectedCategories: string[];
  categoryMatchMode: CategoryMatchMode;
  onToggleCategory: (value: string) => void;
  onCategoryMatchModeChange: (mode: CategoryMatchMode) => void;
  onClearCategories: () => void;
  onClose: () => void;
}

/**
 * The full category list, moved off the main toolbar into a bottom sheet so the
 * directory stays clean. Every category is a toggle chip; when 2+ are selected
 * the match-mode (all/any) segmented control appears, mirroring the inline
 * behaviour.
 */
export default function CategoryFilterSheet({
  categoryOptions,
  categoryCounts,
  selectedCategories,
  categoryMatchMode,
  onToggleCategory,
  onCategoryMatchModeChange,
  onClearCategories,
  onClose,
}: CategoryFilterSheetProps) {
  const t = useT();
  const { locale } = useLanguage();
  const titleId = useId();

  return (
    <BottomSheet
      closeLabel={t("detail_close")}
      labelledBy={titleId}
      onClose={onClose}
    >
      <div className="flex max-h-[80dvh] flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2
            className="text-xl font-bold tracking-[-0.03em] text-ink"
            id={titleId}
          >
            {t("toolbar_allCategories")}
          </h2>
          {selectedCategories.length > 0 ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-[13px] font-semibold text-ink/60 transition hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onClearCategories}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("toolbar_reset")}
            </button>
          ) : null}
        </div>

        {selectedCategories.length >= 2 ? (
          <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-chip bg-tone p-1">
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

        <div className="mt-4 flex flex-wrap gap-2 overflow-y-auto">
          {categoryOptions.map((category) => {
            const isActive = selectedCategories.includes(category);
            const count = categoryCounts[category] ?? 0;
            const isEmpty = count === 0 && !isActive;
            return (
              <button
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 rounded-chip border px-3.5 py-2 text-[13px] font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  isActive
                    ? "border-ink bg-ink text-cloud"
                    : isEmpty
                      ? "border-line text-ink/30 hover:text-ink/60"
                      : "glass-chip text-ink/70 hover:text-ink"
                }`}
                key={category}
                onClick={() => onToggleCategory(category)}
                type="button"
              >
                {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                {categoryLabel(category, locale)}
                <span className={isActive ? "text-cloud/55" : "text-ink/50"}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          className="mt-5 w-full rounded-chip bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          onClick={onClose}
          type="button"
        >
          {t("toolbar_filtersDone")}
        </button>
      </div>
    </BottomSheet>
  );
}

function segmentClassName(isActive: boolean) {
  return `rounded-chip px-3 py-1.5 text-[12px] font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
    isActive ? "bg-ink text-cloud" : "text-ink/60 hover:text-ink/80"
  }`;
}
