// Device-local recent directory searches — a small QoL touch so returning
// visitors can re-run a search in one tap. Stored in localStorage; capped and
// de-duplicated (most recent first). All functions are SSR-safe no-ops when
// there's no window.

const STORAGE_KEY = "farms.recentSearches";
const MAX_RECENT = 6;
const MAX_LENGTH = 80;

export function readRecentSearches(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((x): x is string => typeof x === "string")
          .slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

/** Prepend a term (trimmed, de-duped case-insensitively) and persist. Returns
 *  the new list. Blank/too-short terms are ignored. */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim().slice(0, MAX_LENGTH);
  if (typeof localStorage === "undefined" || trimmed.length < 2) {
    return readRecentSearches();
  }
  const existing = readRecentSearches().filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...existing].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota / privacy mode — feedback only, safe to ignore.
  }
  return next;
}

export function clearRecentSearches(): string[] {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}
