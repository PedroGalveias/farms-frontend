import type { Farm } from "@/types/farm";

export const FARM_CACHE_STORAGE_KEY = "farms.offline.cache.v1";

/**
 * Saved farms cache their own copy, under their own key.
 *
 * These two must never share storage. The directory cache is "every farm there
 * is", written by the home page and read when the backend is unreachable.
 * /saved holds only the handful a visitor favourited — writing that to the
 * directory key would shrink the offline directory to someone's bookmarks.
 * (/saved used to be handed the whole directory, so the same key was harmless;
 * it is not any more.)
 */
export const SAVED_FARM_CACHE_STORAGE_KEY = "farms.offline.saved.v1";

interface CachedFarms {
  farms: Farm[];
  savedAt: string;
}

function isFarm(value: unknown): value is Farm {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Farm>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.canton === "string" &&
    typeof candidate.coordinates === "string" &&
    typeof candidate.created_at === "string" &&
    Array.isArray(candidate.categories) &&
    candidate.categories.every((category) => typeof category === "string")
  );
}

export function readCachedFarms(key = FARM_CACHE_STORAGE_KEY): Farm[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<CachedFarms>;
    if (Array.isArray(parsed.farms)) {
      return parsed.farms.filter(isFarm);
    }
  } catch {
    // Corrupt or unavailable storage: treat as no offline cache.
  }

  return [];
}

export function writeCachedFarms(
  farms: Farm[],
  key = FARM_CACHE_STORAGE_KEY,
): void {
  if (typeof window === "undefined" || farms.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ farms, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage can be full or disabled; offline cache is best-effort.
  }
}
