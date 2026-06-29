"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, MapPin, Trash2, X } from "lucide-react";
import { getCantonName } from "@/lib/farms";
import { tripDirectionsUrl, type TripStop } from "@/lib/trip";
import { useT } from "@/components/i18n/LanguageProvider";

interface TripSheetProps {
  stops: TripStop[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function TripSheet({
  stops,
  onClose,
  onRemove,
  onClear,
}: TripSheetProps) {
  const t = useT();
  const routeUrl = tripDirectionsUrl(stops);

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

  if (typeof document === "undefined") {
    return null;
  }

  // Portal to <body> so position:fixed pins to the viewport (the FAB that opens
  // this can live inside transformed ancestors).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={t("trip_close")}
        className="qs-backdrop absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby="trip-heading"
        aria-modal="true"
        className="qs-sheet relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] border border-line bg-cloud shadow-[0_-16px_60px_rgba(20,22,27,0.3)] sm:max-h-[80dvh] sm:rounded-[32px] sm:shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-6 sm:px-7 sm:pt-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pine">
              {t("nav_directory")}
            </p>
            <h2
              className="mt-2 text-3xl font-extrabold leading-[0.98] tracking-[-0.04em] text-ink"
              id="trip-heading"
            >
              {t("trip_title")}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink/50">
              {t("trip_subtitle")}
            </p>
          </div>
          <button
            aria-label={t("trip_close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/60 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-3 sm:px-4">
          {stops.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-ink/55">
              {t("trip_empty")}
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {stops.map((stop, index) => (
                <li
                  className="flex items-center gap-3 rounded-2xl px-3 py-3"
                  key={stop.id}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pine/10 text-xs font-bold text-pine">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold tracking-[-0.02em] text-ink">
                      {stop.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink/45">
                      <MapPin className="h-3 w-3 shrink-0 text-ink/30" />
                      {stop.canton} · {getCantonName(stop.canton)}
                    </span>
                  </span>
                  <button
                    aria-label={t("trip_remove")}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-tone hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-ink/20"
                    onClick={() => onRemove(stop.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-7">
          {routeUrl ? (
            <a
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              href={routeUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              {t("trip_route")}
            </a>
          ) : null}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-cloud px-5 py-3.5 text-sm font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onClear}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            {t("trip_clear")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
