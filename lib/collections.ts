// Account-free "collections" — named groups for organizing saved farms,
// persisted in localStorage (alongside favorites). Pure list operations live
// here; the React state + storage wiring is in PersonalizationProvider.

export const COLLECTIONS_STORAGE_KEY = "farms.collections";

export interface Collection {
  id: string;
  name: string;
  farmIds: string[];
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readCollections(): Collection[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (entry): entry is Collection =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as Collection).id === "string" &&
          typeof (entry as Collection).name === "string" &&
          Array.isArray((entry as Collection).farmIds),
      )
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        farmIds: entry.farmIds.filter(
          (value): value is string => typeof value === "string",
        ),
      }));
  } catch {
    // Corrupt JSON or storage disabled — treat as none.
  }
  return [];
}

export function writeCollections(collections: Collection[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      COLLECTIONS_STORAGE_KEY,
      JSON.stringify(collections),
    );
  } catch {
    // Storage full or disabled — non-fatal.
  }
}

/** A new collection with a fresh id, or null for a blank name. */
export function makeCollection(
  name: string,
  farmIds: string[] = [],
): Collection | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return { id: newId(), name: trimmed, farmIds: [...farmIds] };
}

/** Append a new (empty) collection. Blank names are ignored. */
export function createCollection(
  collections: Collection[],
  name: string,
): Collection[] {
  const created = makeCollection(name);
  return created ? [...collections, created] : collections;
}

export function renameCollection(
  collections: Collection[],
  id: string,
  name: string,
): Collection[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return collections;
  }
  return collections.map((collection) =>
    collection.id === id ? { ...collection, name: trimmed } : collection,
  );
}

export function deleteCollection(
  collections: Collection[],
  id: string,
): Collection[] {
  return collections.filter((collection) => collection.id !== id);
}

/** Add/remove a farm from a collection (membership toggle). */
export function toggleFarmInCollection(
  collections: Collection[],
  id: string,
  farmId: string,
): Collection[] {
  return collections.map((collection) => {
    if (collection.id !== id) {
      return collection;
    }
    const has = collection.farmIds.includes(farmId);
    return {
      ...collection,
      farmIds: has
        ? collection.farmIds.filter((value) => value !== farmId)
        : [...collection.farmIds, farmId],
    };
  });
}

/** Remove a farm from every collection (e.g. when it's un-favorited). */
export function removeFarmFromCollections(
  collections: Collection[],
  farmId: string,
): Collection[] {
  return collections.map((collection) =>
    collection.farmIds.includes(farmId)
      ? {
          ...collection,
          farmIds: collection.farmIds.filter((value) => value !== farmId),
        }
      : collection,
  );
}
