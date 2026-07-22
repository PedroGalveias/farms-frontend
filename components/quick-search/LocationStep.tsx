"use client";

import { useId, type KeyboardEvent } from "react";
import {
  Crosshair,
  LoaderCircle,
  Locate,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import type { QuickSearchCoordinates } from "@/lib/quick-search";

export type GeoState = "idle" | "locating" | "ready" | "error";

interface CantonOption {
  code: string;
  name: string;
}

interface LocationStepProps {
  cantonOptions: CantonOption[];
  geoMessage: string | null;
  geoState: GeoState;
  locationInput: string;
  onClearGeolocation: () => void;
  onContinue: () => void;
  onLocationInputChange: (value: string) => void;
  onRequestGeolocation: () => void;
  sharedCoordinates: QuickSearchCoordinates | null;
  typedCoordinates: QuickSearchCoordinates | null;
}

export default function LocationStep({
  cantonOptions,
  geoMessage,
  geoState,
  locationInput,
  onClearGeolocation,
  onContinue,
  onLocationInputChange,
  onRequestGeolocation,
  sharedCoordinates,
  typedCoordinates,
}: LocationStepProps) {
  const inputId = useId();
  const t = useT();

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onContinue();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-[-0.035em] text-ink sm:text-[28px]">
          {t("qs_loc_title")}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-ink/60">
          {t("qs_loc_subcopy")}
        </p>
      </div>

      {sharedCoordinates ? (
        <div className="flex items-center justify-between gap-3 rounded-field border border-pine/20 bg-pine/[0.07] px-4 py-3.5">
          <span className="flex items-center gap-2.5 text-sm font-bold text-pine">
            <Navigation className="h-4 w-4" />
            {t("qs_loc_using")}
          </span>
          <button
            aria-label={t("qs_loc_stop")}
            className="rounded-chip p-1.5 text-ink/60 transition hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onClearGeolocation}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          className="flex w-full items-center justify-center gap-2.5 rounded-field border border-pine/25 bg-pine/[0.07] px-5 py-3.5 text-sm font-bold text-pine transition duration-200 hover:bg-pine/[0.12] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-pine/30 disabled:cursor-wait disabled:opacity-70"
          disabled={geoState === "locating"}
          onClick={onRequestGeolocation}
          type="button"
        >
          {geoState === "locating" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          {geoState === "locating"
            ? t("qs_loc_locating")
            : t("qs_loc_use_current")}
        </button>
      )}

      {geoState === "error" && geoMessage ? (
        <div
          className="rounded-field border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
          role="status"
        >
          {geoMessage}
        </div>
      ) : null}

      <div className="flex items-center gap-3 text-xs font-semibold text-ink/60">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {t("qs_loc_or_type")}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      <div>
        <label className="sr-only" htmlFor={inputId}>
          {t("qs_loc_input_label")}
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/30" />
          <input
            autoComplete="off"
            className="w-full rounded-field border border-transparent bg-tone py-3.5 pl-12 pr-4 text-base font-medium text-ink placeholder:font-normal placeholder:text-ink/70 transition duration-300 focus:border-pine/50 focus:bg-cloud focus:ring-4 focus:ring-pine/10"
            id={inputId}
            onChange={(event) => onLocationInputChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("qs_loc_placeholder")}
            type="text"
            value={locationInput}
          />
        </div>

        {typedCoordinates && !sharedCoordinates ? (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-chip bg-pine/10 px-3 py-1.5 text-xs font-semibold text-pine">
            <Crosshair className="h-3.5 w-3.5" />
            {t("qs_loc_coords_detected")}
          </p>
        ) : null}
      </div>

      {cantonOptions.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-ink/60">
            {t("qs_loc_cantons")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cantonOptions.map(({ code, name }) => {
              const isActive =
                locationInput.trim().toLowerCase() === name.toLowerCase();

              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-chip border px-3.5 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    isActive
                      ? "border-ink bg-ink text-cloud shadow-elev-2"
                      : "border-line bg-cloud text-ink/70 hover:border-ink/30 hover:text-ink"
                  }`}
                  key={code}
                  onClick={() => onLocationInputChange(isActive ? "" : name)}
                  type="button"
                >
                  <span className={isActive ? "text-cloud/60" : "text-ink/60"}>
                    {code}
                  </span>{" "}
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
