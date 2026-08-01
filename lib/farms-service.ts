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
// The first page of the directory pays for waking the backend. Free-tier Render
// spins down when idle and can take tens of seconds to answer the first
// request, which 8s reliably lost — every visitor arriving at a cold backend
// got an empty directory. Only page 0 gets this budget; the rest are hot.
const COLD_START_TIMEOUT_MS = 20_000;
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

    let parsed: FarmsPage;
    try {
      const response = await fetch(url, {
        // Serve the directory from the Next Data Cache (shared across requests
        // and routes) and refresh at most every 5 minutes, instead of hammering
        // the backend on every page view. A successful create busts the tag.
        // The signal only bounds a cache *miss* — cached hits never hit the
        // network. Each page caches under its own URL.
        next: { revalidate: 300, tags: [FARMS_CACHE_TAG] },
        // The first request absorbs the backend's cold start (free-tier Render
        // spins down and can take tens of seconds to wake); later pages are hot
        // and keep the tighter bound.
        signal: AbortSignal.timeout(
          page === 0 ? COLD_START_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
        ),
      });

      if (!response.ok) {
        throw new FarmsApiError(
          await readErrorMessage(response),
          response.status,
        );
      }
      parsed = parseFarmsPage(await response.json());
    } catch (error) {
      // Serve what we already have rather than nothing.
      //
      // The directory is ~3,155 farms and the backend caps a page at 100, so a
      // full load is 32 sequential requests. Treating any one of them as fatal
      // meant a single slow page threw away the other 31 — which is exactly
      // what production on Vercel was doing: one cold-start timeout on request
      // #1 and the whole page rendered "Service offline" with an empty
      // directory, while the same code on Render (warm, co-located backend)
      // never tripped it.
      //
      // A directory missing its tail is worth far more to a visitor than no
      // directory at all, so a mid-flight failure now stops paging and returns
      // the pages that did arrive. With nothing at all we still throw, because
      // an empty list is indistinguishable from "there are no farms" and the
      // caller needs to show the error state.
      if (farms.length > 0) {
        console.warn(
          `[farms] page ${page} failed after ${farms.length} farms; serving partial directory`,
          error,
        );
        break;
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new FarmsApiError(
          "The farms service took too long to respond.",
          504,
        );
      }
      throw error;
    }

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
