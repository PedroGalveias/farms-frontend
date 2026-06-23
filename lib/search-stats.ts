// Per-device search statistics: which products/categories this visitor searches
// for most, persisted in localStorage. Drives the home "Most wanted" card.
//
// Backend-ready by design: `rankMostWanted` blends local counts with an optional
// `globalCounts` map. Today that map is empty (no backend), so ranking is purely
// per-device with an availability-based fallback; a future endpoint can supply
// real cross-user counts to `globalCounts` without touching the call sites.

export const SEARCH_STATS_STORAGE_KEY = "farms.searchStats";

export type SearchCounts = Record<string, number>;

export function readSearchCounts(): SearchCounts {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(SEARCH_STATS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const counts: SearchCounts = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
          counts[key] = value;
        }
      }
      return counts;
    }
  } catch {
    // Corrupt JSON or storage disabled — treat as no stats.
  }
  return {};
}

export function writeSearchCounts(counts: SearchCounts): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      SEARCH_STATS_STORAGE_KEY,
      JSON.stringify(counts),
    );
  } catch {
    // Storage full or disabled — non-fatal.
  }
}

/** Pure: return a new counts map with each key incremented by one. */
export function incrementCounts(
  counts: SearchCounts,
  keys: string[],
): SearchCounts {
  const next = { ...counts };
  for (const key of keys) {
    if (key) {
      next[key] = (next[key] ?? 0) + 1;
    }
  }
  return next;
}

/** Record one search worth of keys (products/categories) for this device. */
export function trackSearch(keys: string[]): void {
  if (keys.length === 0) {
    return;
  }
  writeSearchCounts(incrementCounts(readSearchCounts(), keys));
}

/** Pure: sum any number of counts maps into one. */
export function mergeCounts(...sources: SearchCounts[]): SearchCounts {
  const merged: SearchCounts = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

/** Pure: the `limit` most-counted keys, ties broken alphabetically. */
export function topKeys(counts: SearchCounts, limit: number): string[] {
  return Object.entries(counts)
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, limit)
    .map(([key]) => key);
}

interface MostWantedInput {
  localCounts: SearchCounts;
  /** Future cross-user counts from a backend; empty for now. */
  globalCounts?: SearchCounts;
  /** Availability-based default (e.g. top categories) when stats are thin. */
  fallback: string[];
  limit: number;
}

/**
 * The "most wanted" keys: blend local + global search counts, take the top
 * `limit`, then pad with the availability fallback so the card is never empty
 * and never shorter than `limit` (when enough distinct keys exist).
 */
export function rankMostWanted({
  localCounts,
  globalCounts = {},
  fallback,
  limit,
}: MostWantedInput): string[] {
  const ranked = topKeys(mergeCounts(localCounts, globalCounts), limit);
  if (ranked.length >= limit) {
    return ranked;
  }
  const result = [...ranked];
  for (const key of fallback) {
    if (result.length >= limit) {
      break;
    }
    if (!result.includes(key)) {
      result.push(key);
    }
  }
  return result.slice(0, limit);
}
