import { SEASONAL_PRODUCE } from "@/lib/seasonal";

// Device-local seasonal reminders. The visitor subscribes to a produce key on
// the seasonal calendar; when that item is in season we nudge them in-app (web
// push is unreliable on iOS, so we deliberately keep this client-side and
// surface it the next time the app is opened during the season).
const SUBS_KEY = "farms.seasonalReminders";
const ACK_KEY = "farms.seasonalReminders.ack";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Produce keys the visitor wants to be reminded about. */
export function readReminders(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SUBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only keys we still know about, de-duplicated.
    return Array.from(
      new Set(
        parsed.filter(
          (key): key is string =>
            typeof key === "string" && key in SEASONAL_PRODUCE,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function writeReminders(keys: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SUBS_KEY, JSON.stringify(keys));
  } catch {
    // Storage may be full or blocked — reminders are best-effort.
  }
}

/** Per-key acknowledgement, recording the year the nudge was last dismissed. */
export function readAck(): Record<string, number> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeAck(ack: Record<string, number>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ACK_KEY, JSON.stringify(ack));
  } catch {
    // Best-effort.
  }
}

/**
 * Subscribed produce that is in season *now* and hasn't been acknowledged yet
 * this year — i.e. the nudges that are currently due. Acknowledging dismisses a
 * key for the calendar year, so it re-triggers next season.
 */
export function dueReminders(
  subscribed: string[],
  date: Date,
  ack: Record<string, number>,
): string[] {
  const month = date.getMonth() + 1; // SEASONAL_PRODUCE.months are 1-based.
  const year = date.getFullYear();
  return subscribed.filter((key) => {
    const produce = SEASONAL_PRODUCE[key];
    if (!produce) return false;
    if (!produce.months.includes(month)) return false;
    return ack[key] !== year;
  });
}
