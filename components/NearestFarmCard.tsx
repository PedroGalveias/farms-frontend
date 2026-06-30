"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, MapPin, Navigation } from "lucide-react";
import { getNearestFarm } from "@/lib/quick-search";
import {
  geolocationErrorKey,
  readStoredLocation,
  requestCurrentPosition,
  writeStoredLocation,
  type GeolocationCoords,
  type GeolocationErrorReason,
} from "@/lib/geolocation";
import { useT } from "@/components/i18n/LanguageProvider";
import NearMeSheet from "@/components/NearMeSheet";
import type { Farm } from "@/types/farm";

type GeoStatus = "idle" | "locating" | "ready" | "error";

function compactDistance(km: number) {
  if (km < 1) {
    return "< 1 km";
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

interface NearestFarmCardProps {
  farms: Farm[];
  onOpenFarm: (farm: Farm) => void;
}

/**
 * Bento card: on request (never on load — privacy) it reads the browser
 * location, finds the single nearest farm, and shows its distance, name, and
 * address. Tapping the result opens the shared farm detail sheet.
 */
export default function NearestFarmCard({
  farms,
  onOpenFarm,
}: NearestFarmCardProps) {
  const t = useT();
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [errorReason, setErrorReason] =
    useState<GeolocationErrorReason>("unavailable");
  const [nearest, setNearest] = useState<{
    farm: Farm;
    distanceKm: number;
  } | null>(null);
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [showNearby, setShowNearby] = useState(false);

  // Reuse a location the visitor already shared (e.g. on a previous visit or
  // from the directory) so coming back doesn't re-prompt. Restored from
  // localStorage only — never requested automatically.
  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStoredLocation();
      if (!stored) {
        return;
      }
      const result = getNearestFarm(farms, stored);
      if (result) {
        setCoords(stored);
        setNearest(result);
        setStatus("ready");
      }
    });
  }, [farms]);

  const locate = () => {
    setStatus("locating");
    // Call directly (no await first) so iOS Safari shows the prompt.
    requestCurrentPosition().then((outcome) => {
      if (outcome.coords) {
        writeStoredLocation(outcome.coords);
        setCoords(outcome.coords);
        const result = getNearestFarm(farms, outcome.coords);
        if (result) {
          setNearest(result);
          setStatus("ready");
          return;
        }
        setErrorReason("unavailable");
        setStatus("error");
        return;
      }
      setErrorReason(outcome.error);
      setStatus("error");
    });
  };

  const cardClassName =
    "col-span-2 flex min-h-[220px] flex-col justify-between rounded-[24px] bg-pine dark:bg-[#1c7c47] p-5 text-white sm:row-span-2 sm:min-h-0";

  if (status === "ready" && nearest) {
    return (
      <>
        <div className="group col-span-2 flex min-h-[220px] flex-col justify-between rounded-[24px] bg-pine dark:bg-[#1c7c47] p-5 text-white sm:row-span-2 sm:min-h-0">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              <Navigation className="h-3.5 w-3.5" />
              {compactDistance(nearest.distanceKm)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              {t("nearest_label")}
            </span>
          </div>
          <div>
            <button
              className="block w-full text-left transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
              onClick={() => onOpenFarm(nearest.farm)}
              type="button"
            >
              <p className="text-2xl font-black leading-[1.05] tracking-[-0.03em]">
                {nearest.farm.name}
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-6 text-white/70">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {nearest.farm.address}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/80">
                {t("nearest_view")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </button>
            {coords ? (
              <button
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
                onClick={() => setShowNearby(true)}
                type="button"
              >
                <Navigation className="h-3.5 w-3.5" />
                {t("near_me_open")}
              </button>
            ) : null}
          </div>
        </div>
        {showNearby && coords ? (
          <NearMeSheet
            coords={coords}
            farms={farms}
            onClose={() => setShowNearby(false)}
            onOpenFarm={(farm) => {
              setShowNearby(false);
              onOpenFarm(farm);
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
          <Navigation className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
          {t("nearest_label")}
        </span>
      </div>
      <div>
        <p className="text-xl font-bold leading-tight tracking-[-0.02em]">
          {status === "error"
            ? t(geolocationErrorKey(errorReason))
            : t("nearest_prompt")}
        </p>
        <button
          className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#14161b] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pine disabled:opacity-70"
          disabled={status === "locating"}
          onClick={locate}
          type="button"
        >
          {status === "locating" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {status === "locating" ? t("nearest_locating") : t("nearest_cta")}
        </button>
      </div>
    </div>
  );
}
