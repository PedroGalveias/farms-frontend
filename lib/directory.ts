import { getFarmGroups } from "@/lib/farms";
import {
  haversineDistanceKm,
  parseQuickSearchCoordinates,
  type QuickSearchCoordinates,
} from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

export type CategoryMatchMode = "all" | "any";

// The radius choices (km) offered by the "within … of me" filter.
export const RADIUS_OPTIONS = [10, 25, 50] as const;

/**
 * Whether a farm matches the free-text directory search (name, address, or a raw
 * category string). `normalizedSearch` is expected pre-trimmed and lower-cased;
 * an empty string matches every farm.
 */
export function matchesSearch(farm: Farm, normalizedSearch: string): boolean {
  if (normalizedSearch.length === 0) {
    return true;
  }
  return (
    farm.name.toLowerCase().includes(normalizedSearch) ||
    farm.address.toLowerCase().includes(normalizedSearch) ||
    farm.categories.some((category) =>
      category.toLowerCase().includes(normalizedSearch),
    )
  );
}

/** Whether a farm is in the selected canton ("all" matches every canton). */
export function matchesCanton(farm: Farm, selectedCanton: string): boolean {
  return selectedCanton === "all" || farm.canton === selectedCanton;
}

/**
 * Whether a (possibly unknown) distance falls within the chosen radius. A null
 * radius means "any distance" (always true); a null distance can never satisfy
 * a real radius.
 */
export function withinRadius(
  distanceKm: number | null,
  radiusKm: number | null,
): boolean {
  if (radiusKm === null) {
    return true;
  }
  return distanceKm !== null && distanceKm <= radiusKm;
}

/**
 * Whether a farm matches a multi-select category filter. With no categories
 * selected every farm matches. In "all" mode the farm must carry every selected
 * group; in "any" mode at least one. Matching is at the 13-group level, the same
 * level the directory and quick search operate on.
 */
export function matchesCategories(
  farm: Farm,
  selected: string[],
  mode: CategoryMatchMode,
): boolean {
  if (selected.length === 0) {
    return true;
  }
  const groups = getFarmGroups(farm);
  return mode === "all"
    ? selected.every((category) => groups.includes(category))
    : selected.some((category) => groups.includes(category));
}

/** Number of farms carrying each category group (group → count). */
export function getCategoryCounts(farms: Farm[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const farm of farms) {
    for (const group of getFarmGroups(farm)) {
      counts[group] = (counts[group] ?? 0) + 1;
    }
  }
  return counts;
}

/** Number of farms in each canton (code → count). */
/**
 * Farms per canton code. Blank codes are skipped for the same reason
 * `getUniqueFarmCantons` drops them: a "" key becomes a nameless entry in the
 * canton picker and the search suggestions built from `Object.keys(...)`.
 */
export function getCantonCounts(farms: Farm[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const farm of farms) {
    const code = farm.canton?.trim();
    if (!code) {
      continue;
    }
    counts[code] = (counts[code] ?? 0) + 1;
  }
  return counts;
}

/**
 * Great-circle distance (km) from an origin to a farm, or null when the farm's
 * coordinates can't be parsed.
 */
export function farmDistanceKm(
  farm: Farm,
  origin: QuickSearchCoordinates,
): number | null {
  const coords = parseQuickSearchCoordinates(farm.coordinates);
  return coords ? haversineDistanceKm(origin, coords) : null;
}

/** Compact distance label for a card badge: "< 1 km", "5.4 km", "12 km". */
export function formatDistanceShort(km: number): string {
  if (km < 1) {
    return "< 1 km";
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Whether a farm was added in the current calendar month — drives the "New"
 * badge. Returns false for missing/unparseable dates.
 */
const NEW_FARM_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Whether a farm counts as "new" — added within the last 30 days (a rolling
 * window, so a farm doesn't abruptly stop being new at a month boundary).
 * Future-dated `created_at` (clock skew) is treated as not new.
 */
export function isRecentlyAdded(
  createdAt: string,
  now: Date = new Date(),
): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }
  const ageMs = now.getTime() - created.getTime();
  return ageMs >= 0 && ageMs <= NEW_FARM_WINDOW_MS;
}

/**
 * Strip a farm down to what the directory list actually renders.
 *
 * `products[]` is by far the largest part of a farm — a farm with a dozen
 * products carries roughly six times the bytes of one without — and the
 * directory never reads it. `FarmCard` uses `id`, `name`, `canton`,
 * `coordinates` and `created_at`; the filters use `categories`, which the
 * backend already derives from the products server-side. Free-text search runs
 * over name, address and category slugs (see {@link matchesSearch}).
 *
 * Measured on 3,155 farms with realistic data: 5.14 MB of JSON down to
 * 0.80 MB, 399 KB gzipped down to 145 KB. That payload is serialised into the
 * page, so it is downloaded *and* JSON-parsed on the main thread before
 * hydration can finish — which is why returning to the directory felt slow.
 *
 * The detail view and quick search both need `products` and both fetch their
 * own data, so nothing that reads products loses it.
 */
export function toDirectoryFarm(farm: Farm): Farm {
  // Rebuilt field by field rather than `delete farm.products`: an added field
  // should have to be considered here, not silently inflate every payload.
  return {
    address: farm.address,
    canton: farm.canton,
    categories: farm.categories,
    coordinates: farm.coordinates,
    created_at: farm.created_at,
    id: farm.id,
    name: farm.name,
    updated_at: farm.updated_at,
  };
}
