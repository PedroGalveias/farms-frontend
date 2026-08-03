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
// Ceiling on the whole pagination walk. Per-request timeouts bound each hop,
// not the total: 32 pages at 8s each is over four minutes, and a serverless host
// terminates the invocation long before that — turning a recoverable slow load
// into a hard platform error. 25s leaves room for a cold start plus a healthy
// tail while staying inside a typical function limit; a warm full load is ~5-10s.
const TOTAL_BUDGET_MS = 25_000;
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
// How many pages to request at once after page 0 has told us the shape of the
// pagination. The walk used to be strictly sequential — 32 round trips
// nose-to-tail, which is where "a warm full load is ~5-10s" came from. The
// backend paginates by OFFSET, so every page's offset is known in advance and
// there is no reason to wait for page N before asking for N+1.
//
// Six rather than "all of them": the backend is a single free-tier instance,
// and 32 simultaneous requests is a self-inflicted thundering herd that would
// make the tail slower, not faster.
//
// The wave size ramps 1 → 2 → 4 → 6 up to this ceiling rather than starting
// wide. Nothing tells us how many pages exist, so a wave can only be
// speculative: requesting six when two remain wastes four round trips against
// a backend that is paying for them. Ramping costs one extra wave on a large
// dataset and nothing at all on a small one — a directory that fits in two
// pages still makes exactly two requests.
const FARMS_PAGE_CONCURRENCY = 6;

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

/**
 * Every farm in the directory, assembled by following the backend's offset
 * pagination.
 *
 * Resilience matters more here than completeness: a page failing mid-flight
 * returns the farms already collected instead of discarding them, and the whole
 * walk is bounded by {@link TOTAL_BUDGET_MS} so it can never outlive the
 * serverless invocation that called it. Throws only when nothing at all could
 * be fetched, since an empty list would otherwise be indistinguishable from a
 * directory with no farms in it.
 */
/**
 * Fetch one page of the list endpoint.
 *
 * Pulled out of the walk so the sequential fallback and the parallel fast path
 * cannot drift apart in their caching, timeout or error handling.
 */
async function fetchFarmsPage(
  offset: number | undefined,
  { deadline, isFirst }: { deadline: number; isFirst: boolean },
): Promise<FarmsPage> {
  const remaining = deadline - Date.now();
  const url = new URL(`${getFarmsApiBaseUrl()}/farms`);
  url.searchParams.set("limit", String(FARMS_PAGE_LIMIT));
  if (offset !== undefined && offset > 0) {
    url.searchParams.set("offset", String(offset));
  }

  const response = await fetch(url, {
    // Serve the directory from the Next Data Cache (shared across requests and
    // routes) and refresh at most every 5 minutes, instead of hammering the
    // backend on every page view. A successful create busts the tag. The
    // signal only bounds a cache *miss* — cached hits never hit the network.
    // Each page caches under its own URL.
    next: { revalidate: 300, tags: [FARMS_CACHE_TAG] },
    // The first request absorbs the backend's cold start (free-tier Render
    // spins down and can take tens of seconds to wake); later pages are hot and
    // keep the tighter bound. Never wait past the overall deadline.
    signal: AbortSignal.timeout(
      Math.max(
        1,
        Math.min(
          isFirst ? COLD_START_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
          remaining,
        ),
      ),
    ),
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
  return parseFarmsPage(await response.json());
}

export async function getFarms(): Promise<Farm[]> {
  const farms: Farm[] = [];
  const seen = new Set<string>();
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  const collect = (page: FarmsPage) => {
    for (const farm of page.farms) {
      if (!seen.has(farm.id)) {
        seen.add(farm.id);
        farms.push(farm);
      }
    }
  };

  // Page 0 on its own: it pays the cold start, and its response tells us
  // whether offsets are predictable enough to parallelise the rest.
  let first: FarmsPage;
  try {
    first = await fetchFarmsPage(0, { deadline, isFirst: true });
  } catch (error) {
    // Nothing at all arrived. An empty list is indistinguishable from "there
    // are no farms", so the caller needs the error state rather than a page
    // that quietly claims the directory is empty.
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new FarmsApiError(
        "The farms service took too long to respond.",
        504,
      );
    }
    throw error;
  }
  collect(first);

  // The older backend returns everything at once and sets no cursor.
  if (!first.nextCursor) {
    return farms.map(normalizeFarm);
  }

  // `next_cursor` is the next OFFSET to request. If page 0 hands back exactly
  // one page's worth, offsets are arithmetic and every later page can be
  // requested without waiting for its predecessor. If it hands back anything
  // else the scheme is not what we think it is, and guessing offsets would
  // silently skip or duplicate farms — so fall back to following the cursor
  // one page at a time, which is always correct if slower.
  if (first.nextCursor !== String(FARMS_PAGE_LIMIT)) {
    return walkSequentially(farms, seen, first.nextCursor, deadline);
  }

  let page = 1;
  let waveSize = 1;

  while (page < FARMS_MAX_PAGES) {
    if (Date.now() >= deadline) {
      console.warn(
        `[farms] pagination budget spent after ${farms.length} farms; serving partial directory`,
      );
      break;
    }

    const wave = Array.from(
      { length: Math.min(waveSize, FARMS_MAX_PAGES - page) },
      (_, index) => page + index,
    );
    const results = await Promise.allSettled(
      wave.map((n) =>
        fetchFarmsPage(n * FARMS_PAGE_LIMIT, { deadline, isFirst: false }),
      ),
    );

    // Collect in wave order so a farm's position stays stable across loads
    // regardless of which request happened to finish first.
    let reachedEnd = false;
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        // A directory missing its tail is worth far more to a visitor than no
        // directory at all — one slow page must not discard the other 31, which
        // is exactly what production was doing before the walk tolerated
        // partial failure.
        console.warn(
          `[farms] page ${wave[index]} failed after ${farms.length} farms; serving partial directory`,
          result.reason,
        );
        reachedEnd = true;
        break;
      }
      collect(result.value);
      // The cursor is the backend's own statement about whether more exists,
      // so it is the only thing worth believing. Inferring the tail from a
      // short page would be a guess that disagrees with an explicit cursor —
      // and any page this wave requested past the real end simply came back
      // empty and contributed nothing.
      if (!result.value.nextCursor) {
        reachedEnd = true;
        break;
      }
    }
    if (reachedEnd) {
      break;
    }
    page += wave.length;
    waveSize = Math.min(waveSize * 2, FARMS_PAGE_CONCURRENCY);
  }

  return farms.map(normalizeFarm);
}

/**
 * Follow `next_cursor` one page at a time.
 *
 * The correct-but-slow path, kept for the case where the backend's cursor is
 * not a plain page-sized offset. Nothing in the current backend takes this
 * branch; it exists so a pagination change degrades to "slower" instead of
 * "silently wrong".
 */
async function walkSequentially(
  farms: Farm[],
  seen: Set<string>,
  startOffset: string,
  deadline: number,
): Promise<Farm[]> {
  let nextOffset: string | undefined = startOffset;

  for (let page = 1; page < FARMS_MAX_PAGES && nextOffset; page++) {
    if (Date.now() >= deadline) {
      console.warn(
        `[farms] pagination budget spent after ${farms.length} farms; serving partial directory`,
      );
      break;
    }
    let parsed: FarmsPage;
    try {
      parsed = await fetchFarmsPage(Number(nextOffset), {
        deadline,
        isFirst: false,
      });
    } catch (error) {
      console.warn(
        `[farms] page ${page} failed after ${farms.length} farms; serving partial directory`,
        error,
      );
      break;
    }
    for (const farm of parsed.farms) {
      if (!seen.has(farm.id)) {
        seen.add(farm.id);
        farms.push(farm);
      }
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
