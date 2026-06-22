import { getCantonName } from "@/lib/farms";
import { tagLabel } from "@/lib/products";
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
