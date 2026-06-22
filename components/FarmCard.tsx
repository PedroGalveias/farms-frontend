"use client";

import {
  ArrowUpRight,
  Heart,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import { tagLabel } from "@/lib/products";
import { formatDistanceShort, isNewThisMonth } from "@/lib/directory";
import { formatFarmDate, getCantonName, splitCoordinates } from "@/lib/farms";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import type { DirectoryViewMode, Farm } from "@/types/farm";

function FavoriteButton({
  farm,
  className = "",
}: {
  farm: Farm;
  className?: string;
}) {
  const t = useT();
  const { isFavorite, toggleFavorite } = usePersonalization();
  const saved = isFavorite(farm.id);

  return (
    <button
      aria-label={saved ? t("card_saved") : t("card_save")}
      aria-pressed={saved}
      className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 ${
        saved ? "bg-pine/10 text-pine" : "bg-tone text-ink/40 hover:text-ink"
      } ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(farm.id);
      }}
      type="button"
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}

interface FarmCardProps {
  farm: Farm;
  variant?: DirectoryViewMode;
  onOpen?: () => void;
  /** Distance from the visitor's location, when known — shows a badge. */
  distanceKm?: number | null;
}

function CantonTag({ farm }: { farm: Farm }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-tone px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">
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
      {isNewThisMonth(farm.created_at) ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-pine px-2.5 py-1 text-[11px] font-bold text-white">
          <Sparkles className="h-3 w-3" />
          {t("card_new")}
        </span>
      ) : null}
      {distanceKm != null ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-[11px] font-bold text-pine">
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
          className="rounded-full bg-tone/70 px-3 py-1 text-xs font-semibold text-ink/60"
          key={category}
        >
          {tagLabel(category, locale)}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full bg-tone/70 px-3 py-1 text-xs font-semibold text-ink/35">
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
  distanceKm,
}: FarmCardProps) {
  const t = useT();
  const { latitude, longitude } = splitCoordinates(farm.coordinates);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    farm.coordinates,
  )}`;

  // A transparent button stretched over the whole card opens the detail sheet,
  // while the Google Maps link sits above it (z-10) so it stays clickable.
  const openOverlay =
    onOpen != null ? (
      <button
        aria-label={`${t("nearest_view")}: ${farm.name}`}
        className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        data-cursor="Open"
        onClick={onOpen}
        type="button"
      />
    ) : null;

  if (variant === "list") {
    const visibleCategories = farm.categories.slice(0, 4);
    const hiddenCount = farm.categories.length - visibleCategories.length;

    return (
      <article className="group relative overflow-hidden rounded-[26px] border border-line bg-cloud p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_24px_50px_-28px_rgba(20,22,27,0.35)] sm:p-6">
        {openOverlay}
        <FavoriteButton
          className="absolute right-5 top-5 sm:right-6 sm:top-6"
          farm={farm}
        />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <CardBadges distanceKm={distanceKm} farm={farm} />
            <h3 className="mt-3 text-2xl font-bold leading-[1.05] tracking-[-0.03em] text-ink">
              {farm.name}
            </h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm leading-6 text-ink/50">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/30" />
              {farm.address}
            </p>
          </div>

          <div className="space-y-1.5 text-sm text-ink/50">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/35">
              {t("card_added")} {formatFarmDate(farm.created_at)}
            </p>
            <a
              className="relative z-10 inline-flex items-center gap-1 font-semibold text-pine transition-colors hover:text-ink"
              href={mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              {latitude}, {longitude}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="lg:max-w-xs lg:justify-self-end">
            <CategoryChips
              categories={visibleCategories}
              hiddenCount={hiddenCount}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-cloud p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-ink/15 hover:shadow-[0_30px_60px_-30px_rgba(20,22,27,0.4)]">
      {openOverlay}
      <div className="flex items-start justify-between gap-3">
        <CardBadges distanceKm={distanceKm} farm={farm} />
        <div className="flex shrink-0 items-center gap-2">
          <FavoriteButton farm={farm} />
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tone text-ink/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-ink group-hover:text-cloud">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-[26px] font-bold leading-[1.04] tracking-[-0.035em] text-ink">
        {farm.name}
      </h3>

      <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-ink/50">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/30" />
        {farm.address}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.1em] text-ink/35">
          {t("card_added")} {formatFarmDate(farm.created_at)}
        </span>
        <a
          className="relative z-10 inline-flex items-center gap-1 font-semibold text-pine transition-colors hover:text-ink"
          href={mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          {latitude}, {longitude}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-auto pt-6">
        <CategoryChips categories={farm.categories} />
      </div>
    </article>
  );
}
