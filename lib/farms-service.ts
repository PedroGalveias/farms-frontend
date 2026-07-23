import {
  FarmsApiError,
  getFarmsApiBaseUrl,
  readErrorMessage,
} from "@/lib/backend";
import { normalizeFarmCategories } from "@/lib/categories";
import type { CreateFarmPayload, Farm, StockStatus } from "@/types/farm";

const STOCK_STATUSES: readonly StockStatus[] = [
  "AVAILABLE",
  "SEASONAL",
  "UNAVAILABLE",
];

/**
 * Canonicalise a product's stock status to the uppercase contract the UI
 * compares against (`item.status === "AVAILABLE"`). The backend enum is
 * SCREAMING_SNAKE_CASE, but a transitional build serialised it lowercase
 * (`"available"`), which those checks silently never matched. Uppercasing at the
 * boundary makes the detail page correct regardless of which backend is live.
 * Anything unrecognised falls back to AVAILABLE — the neutral "no badge" state.
 */
function normalizeStockStatus(status: unknown): StockStatus {
  const upper = typeof status === "string" ? status.toUpperCase() : "";
  return (STOCK_STATUSES as readonly string[]).includes(upper)
    ? (upper as StockStatus)
    : "AVAILABLE";
}

// Re-exported so existing importers of these from farms-service keep working.
export { FarmsApiError, getFarmsApiBaseUrl } from "@/lib/backend";

// A cold Render backend can take tens of seconds to wake. Cap how long we wait
// so a hung backend fails fast (into the cached copy / error UI / a degraded
// status banner) instead of leaving the request — and the page — hanging.
const REQUEST_TIMEOUT_MS = 8000;
const HEALTH_TIMEOUT_MS = 4000;

export async function getFarmsHealth() {
  try {
    // Health must be fresh and snappy, so the status banner reflects a
    // slow/unreachable backend quickly rather than stalling.
    const response = await fetch(`${getFarmsApiBaseUrl()}/health_check`, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Cache tag for the farm list — bust it with revalidateTag(FARMS_CACHE_TAG). */
export const FARMS_CACHE_TAG = "farms";

// The taxonomy-aware backend paginates `GET /farms` (keyset cursor, max 100 per
// page). Request the largest page and follow the cursor so the directory keeps
// getting the full dataset it does its client-side facets/sorting/map over.
const FARMS_PAGE_LIMIT = 100;
// Safety valve: bound the follow-the-cursor loop so a misbehaving backend (a
// cursor that never clears) can never spin forever. 100 pages × 100 = 10k farms,
// comfortably above the ~3.2k dataset.
const FARMS_MAX_PAGES = 100;

/** One page of the list endpoint, tolerant of both backend response shapes. */
interface FarmsPage {
  farms: Farm[];
  nextCursor?: string;
}

/**
 * Parse a `GET /farms` body from either backend:
 *  - taxonomy-aware backend: `{ farms: [...], next_cursor: string | null }`
 *  - older backend: a bare `Farm[]` with no pagination.
 * Keeping both shapes working means this can ship before the backend does.
 */
function parseFarmsPage(body: unknown): FarmsPage {
  if (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Array.isArray((body as { farms?: unknown }).farms)
  ) {
    const page = body as { farms: Farm[]; next_cursor?: string | null };
    return { farms: page.farms, nextCursor: page.next_cursor ?? undefined };
  }

  if (Array.isArray(body)) {
    return { farms: body as Farm[] };
  }

  throw new FarmsApiError(
    "The farms service returned an unexpected response shape.",
    502,
  );
}

/** Canonicalise category variants ONCE at the boundary so every consumer
 * (facets, quick search, cards, map handoff) sees one vocabulary. Products
 * (when present) pass through untouched. */
function normalizeFarm(farm: Farm): Farm {
  return {
    ...farm,
    categories: normalizeFarmCategories(farm.categories ?? []),
    // Products otherwise pass through untouched; only the status casing is
    // canonicalised so the UI's uppercase comparisons hold.
    ...(farm.products
      ? {
          products: farm.products.map((product) => ({
            ...product,
            status: normalizeStockStatus(product.status),
          })),
        }
      : {}),
  };
}

export async function getFarms(): Promise<Farm[]> {
  const farms: Farm[] = [];
  const seen = new Set<string>();
  // The backend paginates by OFFSET: `next_cursor` is the next offset value to
  // pass back as `?offset=`. (Sending it as `?after=` is silently ignored — the
  // server re-serves page 0 forever, piling up duplicate farms and never
  // reaching the tail.) `seen` dedupes defensively in case a page boundary ever
  // overlaps.
  let nextOffset: string | undefined;

  for (let page = 0; page < FARMS_MAX_PAGES; page++) {
    const url = new URL(`${getFarmsApiBaseUrl()}/farms`);
    url.searchParams.set("limit", String(FARMS_PAGE_LIMIT));
    if (nextOffset) {
      url.searchParams.set("offset", nextOffset);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        // Serve the directory from the Next Data Cache (shared across requests
        // and routes) and refresh at most every 5 minutes, instead of hammering
        // the backend on every page view. A successful create busts the tag.
        // The signal only bounds a cache *miss* — cached hits never hit the
        // network. Each page caches under its own URL.
        next: { revalidate: 300, tags: [FARMS_CACHE_TAG] },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new FarmsApiError(
          "The farms service took too long to respond.",
          504,
        );
      }
      throw error;
    }

    if (!response.ok) {
      throw new FarmsApiError(
        await readErrorMessage(response),
        response.status,
      );
    }

    const parsed = parseFarmsPage(await response.json());
    for (const farm of parsed.farms) {
      if (!seen.has(farm.id)) {
        seen.add(farm.id);
        farms.push(farm);
      }
    }

    // No cursor (or the older backend, which returns the whole list at once).
    if (!parsed.nextCursor) {
      break;
    }
    nextOffset = parsed.nextCursor;
  }

  return farms.map(normalizeFarm);
}

export async function createFarm(payload: CreateFarmPayload, cookie?: string) {
  const response = await fetch(`${getFarmsApiBaseUrl()}/farms`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      // Forward the caller's session so the backend can authorize the create
      // if it requires it; harmless when it doesn't.
      ...(cookie ? { cookie } : {}),
    },
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
}
