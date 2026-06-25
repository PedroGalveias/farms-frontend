import type { Farm } from "@/types/farm";

export const FARM_CACHE_STORAGE_KEY = "farms.offline.cache.v1";

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

export function readCachedFarms(): Farm[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FARM_CACHE_STORAGE_KEY);
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

export function writeCachedFarms(farms: Farm[]): void {
  if (typeof window === "undefined" || farms.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      FARM_CACHE_STORAGE_KEY,
      JSON.stringify({ farms, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage can be full or disabled; offline cache is best-effort.
  }
}
