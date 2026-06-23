import { getCantonName } from "@/lib/farms";
import { tagLabel } from "@/lib/products";
import { parseQuickSearchCoordinates } from "@/lib/quick-search";
import type { Locale } from "@/lib/i18n";
import type { Farm } from "@/types/farm";

/** Canonical in-app path for a farm's own page. */
export function farmPath(id: string): string {
  return `/farm/${encodeURIComponent(id)}`;
}

/**
 * Absolute, shareable URL for a farm. `origin` is the site origin
 * (e.g. window.location.origin); a trailing slash is tolerated.
 */
export function farmShareUrl(origin: string, id: string): string {
  return `${origin.replace(/\/$/, "")}${farmPath(id)}`;
}

/**
 * A concise, factual one-line description for link previews and <meta> tags,
 * e.g. "Bauernhof Meier in Bern (BE) — Vegetables, Fruits, Eggs". Category
 * labels are localized; at most a handful are listed.
 */
export function farmMetaDescription(farm: Farm, locale: Locale): string {
  const place = `${getCantonName(farm.canton)} (${farm.canton})`;
  const categories = farm.categories
    .slice(0, 5)
    .map((category) => tagLabel(category, locale))
    .join(", ");
  const base = `${farm.name} in ${place}`;
  return categories ? `${base} — ${categories}` : base;
}

/**
 * schema.org JSON-LD for a farm's page, so search engines can surface it as a
 * rich result with its location on the map. `origin` is the absolute site
 * origin used to build the canonical URL. The `geo` block is omitted when the
 * stored coordinates can't be parsed.
 */
export function farmJsonLd(
  farm: Farm,
  origin: string,
): Record<string, unknown> {
  const coordinates = parseQuickSearchCoordinates(farm.coordinates);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: farm.name,
    url: farmShareUrl(origin, farm.id),
    address: {
      "@type": "PostalAddress",
      streetAddress: farm.address,
      addressRegion: getCantonName(farm.canton),
      addressCountry: "CH",
    },
    ...(coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
        }
      : {}),
  };
}
