"use client";

import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import { tagLabel } from "@/lib/products";
import { haptic } from "@/lib/haptics";
import { prefetchFarmDetail } from "@/lib/prefetch";
import { playTick } from "@/lib/sound";
import HapticTap from "@/components/ui/HapticTap";
import { formatDistanceShort, isRecentlyAdded } from "@/lib/directory";
import { formatFarmDate, getCantonName, splitCoordinates } from "@/lib/farms";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { useLongPress } from "@/components/motion/useLongPress";
import type { DirectoryViewMode, Farm } from "@/types/farm";

export function FavoriteButton({
  farm,
  className = "",
}: {
  farm: Farm;
  className?: string;
}) {
  const t = useT();
  const { isFavorite, toggleFavorite } = usePersonalization();
  const saved = isFavorite(farm.id);
  // Bumped only when the farm is *newly* saved, so the ring pulse plays on save
  // (via key-remount) but not on un-save.
  const [ringKey, setRingKey] = useState(0);

  return (
    <button
      aria-label={saved ? t("card_saved") : t("card_save")}
      aria-pressed={saved}
      // NB: no `relative` here — callers pass their own positioning, and two
      // position utilities on one element resolve by STYLESHEET order, not
      // class order (a base `relative` silently beat the list variant's
      // `absolute right-5 top-5` and dropped the heart into normal flow).
      className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-chip transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
        saved ? "bg-pine/10 text-pine" : "bg-tone text-ink/70 hover:text-ink"
      } ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        haptic();
        playTick();
        if (!saved) setRingKey((k) => k + 1);
        toggleFavorite(farm.id);
      }}
      type="button"
    >
      {ringKey > 0 ? (
        <span aria-hidden className="save-ring" key={ringKey} />
      ) : null}
      <Heart
        className={`relative z-10 h-4 w-4 ${saved ? "fill-current heart-pop" : ""}`}
        key={saved ? "saved" : "unsaved"}
      />
      <HapticTap />
    </button>
  );
}

interface FarmCardProps {
  farm: Farm;
  variant?: DirectoryViewMode;
  /** Open the detail sheet. `sourceEl` (the card) is handed to the View
   *  Transition so the card morphs into the sheet. */
  onOpen?: (sourceEl?: HTMLElement | null) => void;
  /** Long-press (touch) opens the quick-actions sheet for this farm. */
  onLongPress?: (farm: Farm) => void;
  /** Distance from the visitor's location, when known — shows a badge. */
  distanceKm?: number | null;
  /** Featured hero-row card: carries a live backdrop-filter (design §1) on
   *  fine-pointer devices. Only the bounded top slice sets this — never a
   *  whole scrolling list — and it is inert on touch (the iOS crash vector). */
  live?: boolean;
}

function CantonTag({ farm }: { farm: Farm }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-chip bg-tone px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink/70">
      <span className="text-pine">{farm.canton}</span>
      {getCantonName(farm.canton)}
    </span>
  );
}

/** Canton tag plus optional "New" and distance badges. */
function CardBadges({
  farm,
  distanceKm,
}: {
  farm: Farm;
  distanceKm?: number | null;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <CantonTag farm={farm} />
      {isRecentlyAdded(farm.created_at) ? (
        <span className="inline-flex items-center gap-1 rounded-chip bg-pine-surface px-2.5 py-1 text-[11px] font-bold text-white">
          <Sparkles className="h-3 w-3" />
          {t("card_new")}
        </span>
      ) : null}
      {distanceKm != null ? (
        <span className="inline-flex items-center gap-1 rounded-chip bg-pine/10 px-2.5 py-1 text-[11px] font-bold text-pine">
          <Navigation className="h-3 w-3" />
          {formatDistanceShort(distanceKm)}
        </span>
      ) : null}
    </div>
  );
}

function CategoryChips({
  categories,
  hiddenCount = 0,
}: {
  categories: string[];
  hiddenCount?: number;
}) {
  const { locale } = useLanguage();
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => (
        <span
          className="rounded-chip bg-tone/70 px-3 py-1 text-xs font-semibold text-ink/70"
          key={category}
        >
          {tagLabel(category, locale)}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-chip bg-tone/70 px-3 py-1 text-xs font-semibold text-ink/70">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

export default function FarmCard({
  farm,
  variant = "grid",
  onOpen,
  onLongPress,
  distanceKm,
  live = false,
}: FarmCardProps) {
  // Featured live-glass only makes sense on the extended grid card; the dense
  // list row never carries it. Keeping `.glass-card` alongside `.glass-card-live`
  // is deliberate — see the globals.css note (it gates the live blur).
  const surface =
    live && variant === "grid"
      ? "glass glass-card glass-card-live"
      : "glass glass-card";
  const t = useT();
  const { latitude, longitude } = splitCoordinates(farm.coordinates);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    farm.coordinates,
  )}`;

  // The card element is the View-Transition morph source (card → detail sheet).
  const articleRef = useRef<HTMLElement>(null);
  const press = useLongPress(
    onLongPress ? () => onLongPress(farm) : undefined,
    () => onOpen?.(articleRef.current),
  );

  // A transparent button stretched over the whole card opens the detail sheet
  // (tap) or the quick-actions sheet (long-press on touch). Display-only
  // content is pointer-events-none so clicks on the name/address/chips fall
  // through to this overlay (they used to be dead zones); genuinely
  // interactive children (Maps link, favorite) re-enable their own events.
  const openOverlay =
    onOpen != null ? (
      <button
        aria-label={`${t("nearest_view")}: ${farm.name}`}
        className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        data-cursor="Open"
        {...press}
        // Instant navigation (§7): warm the lazy map chunk the moment the user
        // signals intent — hovering, or the first touch of a press — so the
        // detail sheet's map is already loaded when the morph runs. Declared
        // AFTER {...press} so this pointer-down wins; it re-invokes the
        // long-press handler so press tracking is preserved.
        onPointerDown={(event) => {
          prefetchFarmDetail();
          press.onPointerDown(event);
        }}
        onPointerEnter={prefetchFarmDetail}
        type="button"
      />
    ) : null;

  if (variant === "list") {
    // Compact/dense row — the "more farms per screen" counterpart to the
    // extended grid card. One line each for name and address, no product
    // chips or coordinates; the heart lives in its own flex column so it can
    // never overlap content (the old absolute heart sat on the chips).
    const isNew = isRecentlyAdded(farm.created_at);
    return (
      <article
        className="glass glass-card card-cull group relative flex items-center gap-3 overflow-hidden rounded-field px-4 py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-elev-3 sm:gap-4 sm:px-5"
        ref={articleRef}
      >
        {openOverlay}

        {/* Leading canton code — a compact geographic anchor. */}
        <span className="pointer-events-none hidden shrink-0 flex-col items-center justify-center rounded-field bg-tone px-2.5 py-1.5 text-center sm:flex">
          <span className="text-[13px] font-black leading-none tracking-[0.02em] text-pine">
            {farm.canton}
          </span>
        </span>

        <div className="pointer-events-none min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink sm:text-base">
              {farm.name}
            </h3>
            {isNew ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-pine-surface px-2 py-0.5 text-[10px] font-bold text-white">
                <Sparkles className="h-2.5 w-2.5" />
                {t("card_new")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] leading-5 text-ink/55">
            <MapPin className="h-3 w-3 shrink-0 text-ink/30" />
            <span className="truncate">{farm.address}</span>
          </p>
        </div>

        {distanceKm != null ? (
          <span className="pointer-events-none hidden shrink-0 items-center gap-1 rounded-chip bg-pine/10 px-2.5 py-1 text-xs font-bold text-pine sm:inline-flex">
            <Navigation className="h-3 w-3" />
            {formatDistanceShort(distanceKm)}
          </span>
        ) : null}

        <FavoriteButton className="relative shrink-0" farm={farm} />

        <ArrowUpRight className="pointer-events-none hidden h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-ink sm:block" />
      </article>
    );
  }

  return (
    <article
      className={`${surface} card-cull group relative flex h-full flex-col overflow-hidden rounded-panel p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-elev-3`}
      ref={articleRef}
    >
      {openOverlay}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-none">
          <CardBadges distanceKm={distanceKm} farm={farm} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FavoriteButton className="relative" farm={farm} />
          <span className="pointer-events-none grid h-9 w-9 shrink-0 place-items-center rounded-chip bg-tone text-ink/70 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-ink group-hover:text-cloud">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>

      <h3 className="pointer-events-none mt-4 text-[26px] font-bold leading-[1.04] tracking-[-0.035em] text-ink">
        {farm.name}
      </h3>

      <p className="pointer-events-none mt-2 flex items-start gap-1.5 text-sm leading-6 text-ink/60">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/30" />
        {farm.address}
      </p>

      <div className="pointer-events-none mt-5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.1em] text-ink/60">
          {t("card_added")} {formatFarmDate(farm.created_at)}
        </span>
        <a
          className="pointer-events-auto relative z-10 inline-flex items-center gap-1 font-semibold text-pine transition-colors hover:text-ink"
          href={mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          {latitude}, {longitude}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      <div className="pointer-events-none mt-auto pt-6">
        <CategoryChips categories={farm.categories} />
      </div>
    </article>
  );
}
