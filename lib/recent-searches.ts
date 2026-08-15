// Device-local recent directory searches — a small QoL touch so returning
// visitors can re-run a search in one tap. Stored in localStorage; capped and
// de-duplicated (most recent first). All functions are SSR-safe no-ops when
// there's no window.

import {
  readStorageJson,
  removeStorage,
  writeStorageJson,
} from "@/lib/safe-storage";

export const RECENT_SEARCHES_STORAGE_KEY = "farms.recentSearches";
const MAX_RECENT = 6;
const MAX_LENGTH = 80;

export function readRecentSearches(): string[] {
  const parsed = readStorageJson(RECENT_SEARCHES_STORAGE_KEY);
  return Array.isArray(parsed)
    ? parsed
        .filter((x): x is string => typeof x === "string")
        .slice(0, MAX_RECENT)
    : [];
}

/** Prepend a term (trimmed, de-duped case-insensitively) and persist. Returns
 *  the new list. Blank/too-short terms are ignored. */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim().slice(0, MAX_LENGTH);
  if (trimmed.length < 2) {
    return readRecentSearches();
  }
  const existing = readRecentSearches().filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...existing].slice(0, MAX_RECENT);
  writeStorageJson(RECENT_SEARCHES_STORAGE_KEY, next);
  return next;
}

export function clearRecentSearches(): string[] {
  removeStorage(RECENT_SEARCHES_STORAGE_KEY);
  return [];
}
