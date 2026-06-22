"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ArrowLeft, ExternalLink, Heart, MapPin } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import MapPlaceholder from "@/components/MapPlaceholder";
import ShareButton from "@/components/ShareButton";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { formatFarmDate, getCantonName } from "@/lib/farms";
import { tagLabel } from "@/lib/products";
import { farmPath } from "@/lib/share";
import type { Farm } from "@/types/farm";

// Client-only Leaflet, same pattern as the directory's map view.
const FarmsMap = dynamic(() => import("@/components/FarmsMap"), {
  ssr: false,
  loading: () => <MapPlaceholder heightStyle="360px" />,
});

function InfoCard({ children, label }: { children: string; label: string }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
      <p className="text-xs font-semibold text-ink/40">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-ink/80">{children}</p>
    </div>
  );
}

export default function FarmDetail({ farm }: { farm: Farm }) {
  const t = useT();
  const { locale } = useLanguage();
  const { recordView, isFavorite, toggleFavorite } = usePersonalization();
  const saved = isFavorite(farm.id);

  // Landing on a farm's page counts as viewing it.
  useEffect(() => {
    recordView(farm.id);
  }, [farm.id, recordView]);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(farm.coordinates)}`;
  const hasCoordinates = /-?\d+(?:\.\d+)?\s*[,;]\s*-?\d+(?:\.\d+)?/.test(
    farm.coordinates,
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 transition hover:text-ink"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("farm_back")}
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">
          {farm.canton} · {getCantonName(farm.canton)}
        </p>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {farm.name}
        </h1>
        <p className="mt-3 flex items-start gap-1.5 text-base leading-7 text-ink/55">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-ink/30" />
          {farm.address}
        </p>
      </header>

      <div className="mt-7 flex flex-wrap gap-3">
        <a
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
          href={mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          {t("detail_openMaps")}
        </a>
        <ShareButton
          text={farm.address}
          title={farm.name}
          url={farmPath(farm.id)}
        />
        <button
          aria-pressed={saved}
          className={`inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 ${
            saved
              ? "border-pine/30 bg-pine/10 text-pine"
              : "border-line bg-cloud text-ink/75 hover:border-ink/25 hover:text-ink"
          }`}
          onClick={() => toggleFavorite(farm.id)}
          type="button"
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-current heart-pop" : ""}`}
            key={saved ? "saved" : "unsaved"}
          />
          {saved ? t("card_saved") : t("card_save")}
        </button>
      </div>

      <div className="mt-7 space-y-3">
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
                className="rounded-full bg-tone px-3 py-1 text-sm font-semibold text-ink/60"
                key={category}
              >
                {tagLabel(category, locale)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {hasCoordinates ? (
        <div className="mt-7">
          <FarmsMap farms={[farm]} heightStyle="360px" onOpenFarm={() => {}} />
        </div>
      ) : null}
    </main>
  );
}
