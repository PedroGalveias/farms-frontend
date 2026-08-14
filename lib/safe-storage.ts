export type StorageWriteResult =
  { ok: true } | { ok: false; reason: "quota" | "unavailable" };

function quotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.code === 22)
  );
}

/** SSR-safe, exception-safe localStorage read. */
export function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** JSON read with corrupt payloads folded into `null`. */
export function readStorageJson(key: string): unknown | null {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Best-effort write that distinguishes quota exhaustion in one place. */
export function writeStorage(key: string, value: string): StorageWriteResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, reason: "unavailable" };
  }
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: quotaError(error) ? "quota" : "unavailable",
    };
  }
}

export function writeStorageJson(key: string, value: unknown) {
  return writeStorage(key, JSON.stringify(value));
}

export function removeStorage(key: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Typed store: validation/schema logic lives beside the domain type. */
export function safeStorage<T>(
  key: string,
  parse: (value: unknown) => T | null,
) {
  return {
    read: () => parse(readStorageJson(key)),
    remove: () => removeStorage(key),
    write: (value: T) => writeStorageJson(key, value),
  };
}
