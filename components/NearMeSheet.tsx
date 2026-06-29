"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { MapPin, Navigation, X } from "lucide-react";
import { getNearestFarms } from "@/lib/quick-search";
import { formatDistanceShort } from "@/lib/directory";
import { getCantonName } from "@/lib/farms";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Farm } from "@/types/farm";

interface NearMeSheetProps {
  farms: Farm[];
  coords: { latitude: number; longitude: number };
  onOpenFarm: (farm: Farm) => void;
  onClose: () => void;
}

const NEARBY_LIMIT = 12;

/**
 * Mobile-first bottom sheet listing the farms closest to the visitor, nearest
 * first. Opened from the located NearestFarmCard. Tapping a row opens the shared
 * farm detail sheet. Pure presentation over getNearestFarms — no geolocation
 * here (the caller already has the coordinates).
 */
export default function NearMeSheet({
  farms,
  coords,
  onOpenFarm,
  onClose,
}: NearMeSheetProps) {
  const t = useT();
  const nearest = useMemo(
    () => getNearestFarms(farms, coords, NEARBY_LIMIT),
    [farms, coords],
  );

  // Lock the page scroll + slide the tab bar out of the way; Escape closes.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sheet-open");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Render into <body> so position:fixed is relative to the viewport — the card
  // it opens from lives inside a transformed (Reveal) ancestor, which would
  // otherwise become the containing block and push the sheet off-screen.
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={t("near_me_close")}
        className="qs-backdrop absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby="near-me-heading"
        aria-modal="true"
        className="qs-sheet relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] border border-line bg-cloud shadow-[0_-16px_60px_rgba(20,22,27,0.3)] sm:max-h-[80dvh] sm:rounded-[32px] sm:shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-6 sm:px-7 sm:pt-7">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pine">
              <Navigation className="h-3.5 w-3.5" />
              {t("nearest_label")}
            </p>
            <h2
              className="mt-2 text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-ink"
              id="near-me-heading"
            >
              {t("near_me_title")}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink/50">
              {t("near_me_subtitle")}
            </p>
          </div>
          <button
            aria-label={t("near_me_close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/60 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-6">
          {nearest.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-ink/55">
              {t("near_me_empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {nearest.map(({ farm, distanceKm }) => (
                <li key={farm.id}>
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-tone focus-visible:ring-2 focus-visible:ring-ink/20"
                    onClick={() => onOpenFarm(farm)}
                    type="button"
                  >
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-[11px] font-bold text-pine">
                      <Navigation className="h-3 w-3" />
                      {formatDistanceShort(distanceKm)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-ink">
                        {farm.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink/45">
                        <MapPin className="h-3 w-3 shrink-0 text-ink/30" />
                        {farm.canton} · {getCantonName(farm.canton)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
