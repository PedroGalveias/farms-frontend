"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { productGroupOf, tagLabel } from "@/lib/products";
import CopyButton from "@/components/CopyButton";
import ShareButton from "@/components/ShareButton";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { formatFarmDate, getCantonName } from "@/lib/farms";
import { farmPath } from "@/lib/share";
import { supportsViewTransitions } from "@/lib/view-transition";
import type { Farm } from "@/types/farm";

const DRAG_CLOSE_THRESHOLD_PX = 110;
const SNAP_THRESHOLD_PX = 44;

interface FarmDetailSheetProps {
  farm: Farm;
  onClose: () => void;
  selectedProducts: string[];
  /** Extra query (e.g. "?from=quick-search&products=…") for the full-page link
   *  so that page's Back returns to where the visitor came from. */
  viewPageQuery?: string;
}

export default function FarmDetailSheet({
  farm,
  onClose,
  selectedProducts,
  viewPageQuery = "",
}: FarmDetailSheetProps) {
  const { locale } = useLanguage();
  const t = useT();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const lastDeltaRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // Mobile bottom-sheet snap: peek (~52vh) and full (~92vh).
  const [expanded, setExpanded] = useState(false);
  // When the browser morphs the row into the sheet via a View Transition, skip
  // the CSS rise so the two animations don't fight.
  const [useViewTransition] = useState(() => supportsViewTransitions());

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    // Signal the mobile tab bar to slide out so it doesn't obscure the sheet's
    // own controls (Maps / Close). It slides back in on cleanup.
    document.body.classList.add("sheet-open");
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleDragStart = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) {
      return;
    }

    const delta = event.clientY - dragStartYRef.current;
    lastDeltaRef.current = delta;
    // Only translate downward; upward drags are read as an "expand" gesture.
    setDragOffset(Math.max(0, delta));
  };

  const handleDragEnd = () => {
    if (dragStartYRef.current === null) {
      return;
    }

    const delta = lastDeltaRef.current;
    dragStartYRef.current = null;
    lastDeltaRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);

    if (delta > DRAG_CLOSE_THRESHOLD_PX) {
      onClose();
    } else if (delta < -SNAP_THRESHOLD_PX) {
      setExpanded(true);
    } else if (delta > SNAP_THRESHOLD_PX && expanded) {
      setExpanded(false);
    }
  };

  const isCategoryMatched = (category: string) =>
    selectedProducts.includes(productGroupOf(category));

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(farm.coordinates)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={t("detail_closeAria")}
        className="qs-backdrop absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative w-full max-w-xl overflow-y-auto rounded-t-[32px] border border-line bg-cloud shadow-[0_-16px_60px_rgba(20,22,27,0.3)] sm:rounded-[32px] sm:shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)] ${
          expanded ? "max-h-[92vh]" : "max-h-[52vh]"
        } sm:max-h-[88vh] ${useViewTransition ? "" : "qs-sheet"} ${
          isDragging
            ? ""
            : "transition-[transform,max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        }`}
        role="dialog"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          viewTransitionName: "qs-farm",
        }}
      >
        <div
          className="flex cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing sm:hidden"
          onPointerCancel={handleDragEnd}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <span className="h-1.5 w-12 rounded-full bg-ink/15" />
        </div>

        <div className="px-5 pb-7 pt-1 sm:px-7 sm:pb-8 sm:pt-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-ink/40">
                {farm.canton} · {getCantonName(farm.canton)}
              </p>
              <h2
                className="mt-2 text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-ink sm:text-4xl"
                id={titleId}
              >
                {farm.name}
              </h2>
            </div>

            <button
              aria-label={t("detail_close")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/60 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-ink/40">
                    {t("detail_address")}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-ink/80">
                    {farm.address}
                  </p>
                </div>
                <CopyButton value={farm.address} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label={t("detail_coordinates")}>
                {farm.coordinates}
              </InfoCard>
              <InfoCard label={t("detail_added")}>
                {formatFarmDate(farm.created_at)}
              </InfoCard>
            </div>

            <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
              <p className="text-xs font-semibold text-ink/40">
                {t("detail_products")}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {farm.categories.map((category) => (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      isCategoryMatched(category)
                        ? "bg-pine/10 text-pine"
                        : "bg-tone text-ink/60"
                    }`}
                    key={category}
                  >
                    {tagLabel(category, locale)}
                  </span>
                ))}
              </div>
              {selectedProducts.length > 0 ? (
                <p className="mt-2.5 text-xs text-ink/40">
                  {t("detail_highlighted")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              href={mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              {t("detail_openMaps")}
            </a>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              href={`${farmPath(farm.id)}${viewPageQuery}`}
            >
              <Maximize2 className="h-4 w-4" />
              {t("farm_viewPage")}
            </Link>
            <ShareButton
              text={farm.address}
              title={farm.name}
              url={farmPath(farm.id)}
            />
            <button
              className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onClose}
              type="button"
            >
              {t("detail_close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
      <p className="text-xs font-semibold text-ink/40">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-ink/80">{children}</p>
    </div>
  );
}
