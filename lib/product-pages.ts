import { KNOWN_CATEGORY_KEYS } from "@/lib/categories";
import { getFarmGroups } from "@/lib/farms";
import type { Farm } from "@/types/farm";

// URL slugs for the product landing pages (/product/<slug>), one per category
// group. Slugs are stable, ASCII, English-based — they are public URLs and
// must never change once indexed. "Sonstiges" (Other) is deliberately absent:
// a landing page for "other" has nothing to say to a search engine.
const SLUG_TO_CATEGORY: Record<string, string> = {
  fruits: "Früchte",
  vegetables: "Gemüse",
  dairy: "Milchprodukte",
  "meat-poultry": "Fleisch und Geflügel",
  preserves: "Verarbeitete und haltbare Produkte",
  honey: "Honig und Süßstoffe",
  drinks: "Getränke",
  bakery: "Backwaren und Gebäck",
  "flowers-plants": "Blumen und Pflanzen",
  "nuts-seeds-oils": "Nüsse, Samen und Öle",
  "grains-cereals": "Getreide und Cerealien",
  "fish-seafood": "Fisch und Meeresfrüchte",
};

const CATEGORY_TO_SLUG = new Map(
  Object.entries(SLUG_TO_CATEGORY).map(([slug, key]) => [key, slug]),
);

/** All product-page slugs, in catalog (display) order. */
export function getProductSlugs(): string[] {
  return KNOWN_CATEGORY_KEYS.filter((key) => CATEGORY_TO_SLUG.has(key)).map(
    (key) => CATEGORY_TO_SLUG.get(key)!,
  );
}

/** The canonical category key behind a slug, or null for unknown slugs. */
export function categoryForSlug(slug: string): string | null {
  return SLUG_TO_CATEGORY[slug.toLowerCase()] ?? null;
}

/** The landing-page slug for a category key, or null (e.g. "Sonstiges"). */
export function slugForCategory(category: string): string | null {
  return CATEGORY_TO_SLUG.get(category) ?? null;
}

/**
 * The cantons where a category is most available, for a landing page's
 * cross-links into the canton pages. Returns [code, count] pairs, busiest
 * first.
 */
export function getTopCantonsForCategory(
  farms: Farm[],
  category: string,
  limit = 6,
): [string, number][] {
  const counts = new Map<string, number>();
  for (const farm of farms) {
    if (getFarmGroups(farm).includes(category)) {
      const code = farm.canton.toUpperCase();
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}
