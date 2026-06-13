"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ExternalLink, X } from "lucide-react";
import { formatFarmDate, getCantonName } from "@/lib/farms";
import { productMatchesCategory } from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

const DRAG_CLOSE_THRESHOLD_PX = 110;

interface FarmDetailSheetProps {
  farm: Farm;
  onClose: () => void;
  selectedProducts: string[];
}

export default function FarmDetailSheet({
  farm,
  onClose,
  selectedProducts,
}: FarmDetailSheetProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
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

    setDragOffset(Math.max(0, event.clientY - dragStartYRef.current));
  };

  const handleDragEnd = () => {
    if (dragStartYRef.current === null) {
      return;
    }

    dragStartYRef.current = null;
    setIsDragging(false);

    if (dragOffset > DRAG_CLOSE_THRESHOLD_PX) {
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  const isCategoryMatched = (category: string) =>
    selectedProducts.some((product) =>
      productMatchesCategory(product, category),
    );

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(farm.coordinates)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Close farm details"
        className="qs-backdrop absolute inset-0 bg-ink/40 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`qs-sheet relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[32px] border border-line bg-cloud shadow-[0_-16px_60px_rgba(20,22,27,0.3)] sm:rounded-[32px] sm:shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)] ${
          isDragging
            ? ""
            : "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        }`}
        role="dialog"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
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
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/60 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <InfoCard label="Address">{farm.address}</InfoCard>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Coordinates">{farm.coordinates}</InfoCard>
              <InfoCard label="Added">
                {formatFarmDate(farm.created_at)}
              </InfoCard>
            </div>

            <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
              <p className="text-xs font-semibold text-ink/40">
                Products &amp; categories
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
                    {category}
                  </span>
                ))}
              </div>
              {selectedProducts.length > 0 ? (
                <p className="mt-2.5 text-xs text-ink/40">
                  Highlighted items match your search.
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
              Open in Google Maps
            </a>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={onClose}
              type="button"
            >
              Close
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
