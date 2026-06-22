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
export function getCantonCounts(farms: Farm[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const farm of farms) {
    counts[farm.canton] = (counts[farm.canton] ?? 0) + 1;
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
export function isNewThisMonth(
  createdAt: string,
  now: Date = new Date(),
): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth()
  );
}
