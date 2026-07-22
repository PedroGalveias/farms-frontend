"use client";

import { useT } from "@/components/i18n/LanguageProvider";

/** Localized loading placeholder for the lazily-loaded Leaflet map. */
export default function MapPlaceholder({
  heightStyle = "min(70vh, 640px)",
}: {
  heightStyle?: string;
}) {
  const t = useT();
  return (
    <div
      className="skeleton grid place-items-center rounded-card border border-line text-sm text-ink/60"
      style={{ height: heightStyle }}
    >
      {t("map_loading")}
    </div>
  );
}
