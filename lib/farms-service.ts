import {
  FarmsApiError,
  getFarmsApiBaseUrl,
  readErrorMessage,
} from "@/lib/backend";
import { normalizeFarmCategories } from "@/lib/categories";
import { parseApiFacets, type ApiFacets } from "@/lib/directory-facets";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n-core";
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

/** Five minutes, as the fetch options used before Cache Components. */
const FULL_CACHE_LIFE = { revalidate: 300, expire: 3600, stale: 300 } as const;
/**
 * For an answer the backend could not fully supply.
 *
 * Short enough that one blip costs seconds rather than the five minutes a
 * partial directory or a missing facet set would otherwise be served for, and
 * long enough to still absorb a burst rather than hammering a struggling
 * backend once per request.
 */
const DEGRADED_CACHE_LIFE = { revalidate: 10, expire: 60, stale: 10 } as const;

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

/**
 * The `GET /farms` filter subset the directory sends.
 *
 * Only filters the client can reproduce EXACTLY belong here, because the
 * directory re-applies every filter locally after hydration. A server-side
 * filter the client cannot replicate makes rows appear and then vanish.
 *
 * Deliberately absent:
 *  - **`q`** — the API applies free text to product names, and the directory
 *    payload has no products (`toDirectoryFarm` strips them). The server would
 *    return a farm matched on "strawberries" and the client would filter it
 *    straight back out, so the list would visibly shrink after hydration.
 *  - **granular product, `lat`/`lng`/`radius`** — the directory has no product
 *    picker and never puts a visitor's coordinates in a shareable URL.
 *  - **a multi-category ALL match** — the API's category filter is any-of, so
 *    sending it would under-fetch valid candidates. See `toFarmsQuery`.
 */
export interface FarmsQuery {
  canton?: string;
  categories?: string[];
  sort?: "newest" | "name" | "canton";
}

function appendFarmsQuery(url: URL, query: FarmsQuery) {
  if (query.canton) {
    url.searchParams.set("canton", query.canton);
  }
  if (query.categories && query.categories.length > 0) {
    url.searchParams.set("category", query.categories.join(","));
  }
  // `newest` is the backend's own default; omitting it keeps the default view
  // on one cache key instead of two identical ones.
  if (query.sort && query.sort !== "newest") {
    url.searchParams.set("sort", query.sort);
  }
}

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
  {
    deadline,
    isFirst,
    locale,
    query,
  }: {
    deadline: number;
    isFirst: boolean;
    locale: Locale;
    query: FarmsQuery;
  },
): Promise<FarmsPage> {
  const remaining = deadline - performance.now();
  const url = new URL(`${getFarmsApiBaseUrl()}/farms`);
  // Every page of one walk must carry the same language and filters, or the
  // pages would describe different result sets and the offsets would not line
  // up with each other.
  url.searchParams.set("lang", locale);
  url.searchParams.set("limit", String(FARMS_PAGE_LIMIT));
  appendFarmsQuery(url, query);
  if (offset !== undefined && offset > 0) {
    url.searchParams.set("offset", String(offset));
  }

  const response = await fetch(url, {
    // Lifetime and tagging live on `getFarms` itself now (`use cache` +
    // cacheLife + cacheTag), so the whole walk is one cache entry rather than
    // 32 independently-expiring pages. The signal below still bounds a miss.
    // The first request absorbs the backend's cold start (free-tier Render
    // spins down and can take tens of seconds to wake); later pages are hot and
    // keep the tighter bound. Never wait past the overall deadline.
    // Rounded, because `remaining` is a performance.now() delta and therefore
    // fractional. AbortSignal.timeout() rejects a non-integer delay with a
    // RangeError, so the moment the deadline came within one request timeout
    // this threw instead of setting a shorter one — turning "little time left,
    // try quickly" into a page that failed outright and truncated the
    // directory. Caught in a build log against a slow backend:
    // `The value of "delay" is out of range. It must be an integer. Received
    // 7757.074666999997`.
    signal: AbortSignal.timeout(
      Math.max(
        1,
        Math.floor(
          Math.min(
            isFirst ? COLD_START_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
            remaining,
          ),
        ),
      ),
    ),
  });

  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
  return parseFarmsPage(await response.json());
}

export async function getFarms(
  locale: Locale = DEFAULT_LOCALE,
  query: FarmsQuery = {},
): Promise<Farm[]> {
  "use cache";
  // `locale` and `query` are arguments, so they become part of the cache key
  // automatically — each filter combination gets its own entry rather than one
  // of them poisoning the others.
  //
  // The lifetime is NOT set here. `use cache` stores the return value, and a
  // walk that ends early still returns the farms it collected — a directory
  // missing its tail is worth far more to a visitor than no directory at all.
  // Caching that partial list for the full five minutes would serve it to
  // everyone, where the old per-fetch options simply never cached the page that
  // failed. So each exit picks its own lifetime: `FULL_CACHE_LIFE` once the
  // walk is known to have finished, `DEGRADED_CACHE_LIFE` when it did not.
  cacheTag(FARMS_CACHE_TAG);

  const farms: Farm[] = [];
  const seen = new Set<string>();
  const deadline = performance.now() + TOTAL_BUDGET_MS;

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
    first = await fetchFarmsPage(0, {
      deadline,
      isFirst: true,
      locale,
      query,
    });
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
    cacheLife(FULL_CACHE_LIFE);
    return farms.map(normalizeFarm);
  }

  // `next_cursor` is the next OFFSET to request. If page 0 hands back exactly
  // one page's worth, offsets are arithmetic and every later page can be
  // requested without waiting for its predecessor. If it hands back anything
  // else the scheme is not what we think it is, and guessing offsets would
  // silently skip or duplicate farms — so fall back to following the cursor
  // one page at a time, which is always correct if slower.
  if (first.nextCursor !== String(FARMS_PAGE_LIMIT)) {
    return walkSequentially(
      farms,
      seen,
      first.nextCursor,
      deadline,
      locale,
      query,
    );
  }

  let page = 1;
  let waveSize = 1;

  while (page < FARMS_MAX_PAGES) {
    if (performance.now() >= deadline) {
      console.warn(
        `[farms] pagination budget spent after ${farms.length} farms; serving partial directory`,
      );
      cacheLife(DEGRADED_CACHE_LIFE);
      return farms.map(normalizeFarm);
    }

    const wave = Array.from(
      { length: Math.min(waveSize, FARMS_MAX_PAGES - page) },
      (_, index) => page + index,
    );
    const results = await Promise.allSettled(
      wave.map((n) =>
        fetchFarmsPage(n * FARMS_PAGE_LIMIT, {
          deadline,
          isFirst: false,
          locale,
          query,
        }),
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
        cacheLife(DEGRADED_CACHE_LIFE);
        return farms.map(normalizeFarm);
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
      cacheLife(FULL_CACHE_LIFE);
      return farms.map(normalizeFarm);
    }
    page += wave.length;
    waveSize = Math.min(waveSize * 2, FARMS_PAGE_CONCURRENCY);
  }

  // Falling out of the loop means FARMS_MAX_PAGES was reached while the backend
  // was still offering a cursor. That is the safety valve doing its job, but the
  // directory it produced is truncated — only `reachedEnd` above, where the
  // backend itself said there is no more, is a complete walk.
  console.warn(
    `[farms] page cap reached after ${farms.length} farms; serving partial directory`,
  );
  cacheLife(DEGRADED_CACHE_LIFE);
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
  locale: Locale,
  query: FarmsQuery,
): Promise<Farm[]> {
  let nextOffset: string | undefined = startOffset;

  for (let page = 1; page < FARMS_MAX_PAGES && nextOffset; page++) {
    if (performance.now() >= deadline) {
      console.warn(
        `[farms] pagination budget spent after ${farms.length} farms; serving partial directory`,
      );
      cacheLife(DEGRADED_CACHE_LIFE);
      return farms.map(normalizeFarm);
    }
    let parsed: FarmsPage;
    try {
      parsed = await fetchFarmsPage(Number(nextOffset), {
        deadline,
        isFirst: false,
        locale,
        query,
      });
    } catch (error) {
      console.warn(
        `[farms] page ${page} failed after ${farms.length} farms; serving partial directory`,
        error,
      );
      cacheLife(DEGRADED_CACHE_LIFE);
      return farms.map(normalizeFarm);
    }
    for (const farm of parsed.farms) {
      if (!seen.has(farm.id)) {
        seen.add(farm.id);
        farms.push(farm);
      }
    }
    nextOffset = parsed.nextCursor;
  }

  // A cursor still in hand means the loop stopped at FARMS_MAX_PAGES rather
  // than at the end of the directory, so what it collected is truncated.
  if (nextOffset) {
    console.warn(
      `[farms] page cap reached after ${farms.length} farms; serving partial directory`,
    );
    cacheLife(DEGRADED_CACHE_LIFE);
  } else {
    cacheLife(FULL_CACHE_LIFE);
  }
  return farms.map(normalizeFarm);
}

/**
 * One farm by id.
 *
 * The backend has exposed `GET /farms/{id}` since the taxonomy work landed;
 * the frontend never used it. Every caller that needed a single farm — the
 * farm page and its OG image — fetched the *entire* directory and ran
 * `.find()`: ~3,155 farms and 32 paginated requests to render one record.
 *
 * Returns `null` for a 404 rather than throwing, because "no such farm" is a
 * routing outcome (`notFound()`), not a service failure. Anything else throws,
 * so a real outage still surfaces as an error page rather than a silent 404.
 */
/** Cache tag for the facet counts — see {@link getFarmFacets}. */
export const FACETS_CACHE_TAG = "farm-facets";

/**
 * How many farms sit behind each filter option, across the whole directory.
 *
 * Returns `null` rather than throwing when the endpoint is missing, slow or
 * malformed. That is the point of it: facets are an optimisation, and a
 * directory that falls back to counting the farms it already has is strictly
 * better than one that errors. The backend deploys separately, so a frontend
 * release must not require the endpoint to exist yet.
 *
 * Tagged with the farm list as well, because creating a farm changes both — a
 * new farm that did not move its canton's count would be a visible lie.
 */
export async function getFarmFacets(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ApiFacets | null> {
  "use cache";
  // A SUCCESSFUL answer gets the normal five minutes. A failure must not:
  // `null` is the signal that the backend has no /facets yet, and the home page
  // reads it as "do not filter server-side", so a `null` cached for five
  // minutes would disable server-side filtering for every visitor and make a
  // shared /?canton=BE link serve the whole directory for that window.
  //
  // The lifetime is therefore chosen AFTER the fetch, in each branch. Throwing
  // instead would keep the failure out of the cache entirely, but an error
  // raised inside a cached function fails the prerender even when the caller
  // catches it — which is what a build against a backend with no /facets does.
  cacheTag(FARMS_CACHE_TAG, FACETS_CACHE_TAG);

  const url = new URL(`${getFarmsApiBaseUrl()}/facets`);
  url.searchParams.set("lang", locale);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) {
      const facets = parseApiFacets(await response.json());
      if (facets) {
        cacheLife({ revalidate: 300, expire: 3600, stale: 300 });
        return facets;
      }
    }
  } catch {
    // Fall through to the degraded lifetime below.
  }

  cacheLife(DEGRADED_CACHE_LIFE);
  return null;
}

export async function getFarmById(
  id: string,
  locale?: string,
): Promise<Farm | null> {
  "use cache";
  cacheLife({ revalidate: 300, expire: 3600, stale: 300 });
  // Same tag as the list, so creating or editing a farm busts both.
  cacheTag(FARMS_CACHE_TAG);

  const url = new URL(
    `${getFarmsApiBaseUrl()}/farms/${encodeURIComponent(id)}`,
  );
  if (locale) {
    url.searchParams.set("lang", locale);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(COLD_START_TIMEOUT_MS),
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }

  const body = (await response.json()) as unknown;
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new FarmsApiError(
      "The farms service returned an unexpected response shape.",
      502,
    );
  }
  // The detail endpoint flattens the farm and adds `lang` alongside it, so the
  // body *is* the farm. Guard on `id` rather than assuming: a future envelope
  // ({ farm: {...} }) must fail loudly here, not surface as a farm with
  // undefined fields rendered into the page.
  const farm = body as Partial<Farm>;
  if (typeof farm.id !== "string") {
    throw new FarmsApiError(
      "The farms service returned a farm without an id.",
      502,
    );
  }

  return normalizeFarm(farm as Farm);
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
