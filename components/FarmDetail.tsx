"use client";

import Link from "@/components/i18n/LocalizedLink";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Camera,
  ArrowLeft,
  ExternalLink,
  Heart,
  MapPin,
  Route,
} from "lucide-react";
import CopyButton from "@/components/CopyButton";
import MapPlaceholder from "@/components/MapPlaceholder";
import ShareButton from "@/components/ShareButton";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { useTrip } from "@/components/trip/TripProvider";
import AddToCollectionMenu from "@/components/saved/AddToCollectionMenu";
import { detectDirectionsPlatform, directionsUrl } from "@/lib/directions";
import { formatFarmDate, getCantonName } from "@/lib/farms";
import { haptic } from "@/lib/haptics";
import { playTick } from "@/lib/sound";
import HapticTap from "@/components/ui/HapticTap";
import { productKeyForSlug, productLabel, tagLabel } from "@/lib/products";
import { farmPath } from "@/lib/share";
import type { Farm, StockStatus } from "@/types/farm";

// Shared secondary-action button: every action in the 2-column grid is the
// same size (the old flex-wrap layout made "Add to collection" a small
// odd-one-out pill).
const SECONDARY_BTN =
  "relative inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2";
const SECONDARY_IDLE =
  "border-line bg-cloud text-ink/75 hover:border-ink/25 hover:text-ink";
const SECONDARY_ACTIVE = "border-pine/30 bg-pine/10 text-pine";

// Stock status → translation key for the per-product availability badge.
const STOCK_LABEL_KEY: Record<StockStatus, string> = {
  AVAILABLE: "detail_stock_available",
  SEASONAL: "detail_stock_seasonal",
  UNAVAILABLE: "detail_stock_unavailable",
};

// Client-only Leaflet, same pattern as the directory's map view.
const FarmsMap = dynamic(() => import("@/components/FarmsMap"), {
  ssr: false,
  loading: () => <MapPlaceholder heightStyle="360px" />,
});

function InfoCard({ children, label }: { children: string; label: string }) {
  return (
    <div className="glass-inset rounded-2xl px-4 py-3.5">
      <p className="text-xs font-semibold text-ink/60">{label}</p>
      <p className="mt-1.5 break-words text-sm leading-6 text-ink/80">
        {children}
      </p>
    </div>
  );
}

export default function FarmDetail({
  farm,
  backHref = "/",
  fromQuickSearch = false,
}: {
  farm: Farm;
  backHref?: string;
  fromQuickSearch?: boolean;
}) {
  const t = useT();
  const { locale } = useLanguage();
  const { recordView, isFavorite, toggleFavorite } = usePersonalization();
  const saved = isFavorite(farm.id);
  const { isInTrip, toggleStop, isFull } = useTrip();
  const planned = isInTrip(farm.id);
  const [directionsPlatform] = useState<"ios" | "android" | "web">(() =>
    typeof navigator === "undefined"
      ? "web"
      : detectDirectionsPlatform(navigator.userAgent),
  );

  // Landing on a farm's page counts as viewing it.
  useEffect(() => {
    recordView(farm.id);
  }, [farm.id, recordView]);
  // Directions to the farm (opens the Maps app on mobile) — more useful in the
  // field than a static pin.
  const mapsUrl = directionsUrl(farm.coordinates, directionsPlatform);
  const hasCoordinates = /-?\d+(?:\.\d+)?\s*[,;]\s*-?\d+(?:\.\d+)?/.test(
    farm.coordinates,
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
        href={backHref}
      >
        <ArrowLeft className="h-4 w-4" />
        {fromQuickSearch ? t("farm_backToQuickSearch") : t("farm_back")}
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
          {farm.canton} · {getCantonName(farm.canton)}
        </p>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {farm.name}
        </h1>
        <p className="mt-3 flex items-start gap-1.5 text-base leading-7 text-ink/60">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-ink/30" />
          {farm.address}
        </p>
      </header>

      <div className="mt-7 space-y-2.5">
        {/* Primary action, full width. */}
        <a
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          href={mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          {directionsPlatform === "ios"
            ? t("detail_openAppleMaps")
            : t("detail_openMaps")}
        </a>

        {/* Uniform 2-column grid so every secondary action is the same size. */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            aria-pressed={saved}
            className={`${SECONDARY_BTN} ${saved ? SECONDARY_ACTIVE : SECONDARY_IDLE}`}
            onClick={() => {
              haptic();
              playTick();
              toggleFavorite(farm.id);
            }}
            type="button"
          >
            <Heart
              className={`h-4 w-4 ${saved ? "fill-current heart-pop" : ""}`}
              key={saved ? "saved" : "unsaved"}
            />
            {saved ? t("card_saved") : t("card_save")}
            <HapticTap />
          </button>

          <ShareButton
            className={`${SECONDARY_BTN} ${SECONDARY_IDLE}`}
            text={farm.address}
            title={farm.name}
            url={farmPath(farm.id)}
          />

          <AddToCollectionMenu
            className="relative"
            farmId={farm.id}
            triggerClassName={`${SECONDARY_BTN} ${SECONDARY_IDLE}`}
          />

          <button
            aria-pressed={planned}
            className={`${SECONDARY_BTN} disabled:cursor-not-allowed disabled:opacity-50 ${
              planned ? SECONDARY_ACTIVE : SECONDARY_IDLE
            }`}
            disabled={!planned && isFull}
            onClick={() =>
              toggleStop({
                id: farm.id,
                name: farm.name,
                coordinates: farm.coordinates,
                canton: farm.canton,
              })
            }
            type="button"
          >
            <Route className="h-4 w-4" />
            {planned ? t("trip_added") : t("trip_add")}
          </button>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="glass-inset rounded-2xl px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink/60">
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

        <div className="glass-inset rounded-2xl px-4 py-3.5">
          <p className="text-xs font-semibold text-ink/60">
            {t("detail_products")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {farm.products && farm.products.length > 0
              ? // Taxonomy-aware backend: show the real products the farm lists,
                // each with its availability. Falls back to the category chips
                // below for the current backend (no product-level data).
                farm.products.map((item) => {
                  const key = productKeyForSlug(item.slug);
                  const name = key
                    ? productLabel(key, locale)
                    : (item.name_en ?? item.slug);
                  return (
                    <span
                      className={`glass-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                        item.status === "UNAVAILABLE"
                          ? "text-ink/40"
                          : "text-ink/70"
                      }`}
                      key={item.slug}
                    >
                      {name}
                      {item.status !== "AVAILABLE" && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            item.status === "SEASONAL"
                              ? "bg-pine/10 text-pine"
                              : "bg-ink/10 text-ink/50"
                          }`}
                        >
                          {t(STOCK_LABEL_KEY[item.status])}
                        </span>
                      )}
                    </span>
                  );
                })
              : farm.categories.map((category) => (
                  <span
                    className="glass-chip rounded-full px-3 py-1 text-sm font-semibold text-ink/70"
                    key={category}
                  >
                    {tagLabel(category, locale)}
                  </span>
                ))}
          </div>
        </div>
      </div>

      {/* Photo gallery — the backend doesn't serve farm photos yet, so this
          renders as a quiet template until `farm.photos` arrives. */}
      <section aria-labelledby="farm-photos-title" className="mt-7">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60"
          id="farm-photos-title"
        >
          {t("farm_photos")}
        </h2>
        {farm.photos && farm.photos.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {/* Plain <img>: remote gallery URLs with unknown hosts —
                next/image needs a domain allowlist we can't provide until the
                backend ships photos. */}
            {farm.photos.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
                key={src}
                loading="lazy"
                src={src}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((slot) => (
              <div
                className="glass-inset grid aspect-[4/3] place-items-center rounded-2xl"
                key={slot}
              >
                {slot === 1 ? (
                  <Camera aria-hidden className="h-5 w-5 text-ink/25" />
                ) : null}
              </div>
            ))}
            <p className="col-span-3 text-xs leading-5 text-ink/50">
              {t("farm_photosSoon")}
            </p>
          </div>
        )}
      </section>

      {hasCoordinates ? (
        <div className="mt-7">
          <FarmsMap farms={[farm]} heightStyle="360px" onOpenFarm={() => {}} />
        </div>
      ) : null}
    </main>
  );
}
