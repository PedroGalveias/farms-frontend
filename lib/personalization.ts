// Account-free personalization, persisted in localStorage: favorite farms and a
// recently-viewed history. Pure list operations live here (easy to test); the
// React state + storage wiring lives in PersonalizationProvider.

import { readStorageJson, writeStorageJson } from "@/lib/safe-storage";

export const FAVORITES_STORAGE_KEY = "farms.favorites";
export const RECENT_STORAGE_KEY = "farms.recent";

// How many recently-viewed farms to keep.
export const MAX_RECENT = 12;

function readIds(key: string): string[] {
  const parsed = readStorageJson(key);
  if (Array.isArray(parsed)) {
    return parsed.filter((value): value is string => typeof value === "string");
  }
  return [];
}

function writeIds(key: string, ids: string[]): void {
  writeStorageJson(key, ids);
}

/** Add or remove an id, returning a new array (order preserved, newest last). */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

/**
 * Move an id to the front of the history (most-recent-first), de-duplicating and
 * capping the length. Returns a new array.
 */
export function recordRecent(
  ids: string[],
  id: string,
  max: number = MAX_RECENT,
): string[] {
  return [id, ...ids.filter((value) => value !== id)].slice(0, max);
}

export function readFavorites(): string[] {
  return readIds(FAVORITES_STORAGE_KEY);
}

export function writeFavorites(ids: string[]): void {
  writeIds(FAVORITES_STORAGE_KEY, ids);
}

export function readRecent(): string[] {
  return readIds(RECENT_STORAGE_KEY);
}

export function writeRecent(ids: string[]): void {
  writeIds(RECENT_STORAGE_KEY, ids);
}
