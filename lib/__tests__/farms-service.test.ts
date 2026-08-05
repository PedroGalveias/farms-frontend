import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheLife } from "next/cache";
import {
  FarmsApiError,
  getFarmById,
  getFarmFacets,
  getFarms,
} from "@/lib/farms-service";
import type { Farm, FarmProduct } from "@/types/farm";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * The lifetime a cached function picked, as `revalidate` seconds.
 *
 * `use cache` stores the RETURN VALUE, so a degraded answer — a truncated
 * directory, a facet set the backend could not supply — must not inherit the
 * lifetime of a good one. `cacheLife` is stubbed as a spy in vitest.setup.ts
 * precisely so that decision is assertable here.
 */
function chosenRevalidate(): number | undefined {
  const calls = vi.mocked(cacheLife).mock.calls;
  const last = calls.at(-1)?.[0];
  return typeof last === "object" && last !== null && "revalidate" in last
    ? (last as { revalidate?: number }).revalidate
    : undefined;
}

const FULL_REVALIDATE = 300;
const DEGRADED_REVALIDATE = 10;

beforeEach(() => {
  vi.mocked(cacheLife).mockClear();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Queue one Response per expected fetch call, in order. */
function mockFetchSequence(...responses: Response[]) {
  const spy = vi.spyOn(globalThis, "fetch");
  for (const response of responses) {
    spy.mockResolvedValueOnce(response);
  }
  return spy;
}

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
    name: "Berry Farm",
    address: "Main Street 1",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["fruits"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("getFarms — response-shape tolerance", () => {
  it("reads the taxonomy-aware `{ farms, next_cursor }` shape", async () => {
    mockFetchSequence(jsonResponse({ farms: [makeFarm()], next_cursor: null }));

    const farms = await getFarms();

    expect(farms).toHaveLength(1);
    // English group slug is folded to the canonical German catalog key.
    expect(farms[0].categories).toEqual(["Früchte"]);
  });

  it("still reads the older bare-array shape (no pagination)", async () => {
    const spy = mockFetchSequence(
      jsonResponse([makeFarm({ categories: ["Früchte"] })]),
    );

    const farms = await getFarms();

    expect(farms).toHaveLength(1);
    expect(farms[0].categories).toEqual(["Früchte"]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("passes each farm's products[] through untouched", async () => {
    const products: FarmProduct[] = [
      {
        slug: "strawberries",
        name_en: "Strawberries",
        group: "fruits",
        status: "AVAILABLE",
        last_confirmed_at: "2026-06-01T00:00:00Z",
      },
    ];
    mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ products })], next_cursor: null }),
    );

    const farms = await getFarms();

    expect(farms[0].products).toEqual(products);
  });

  it("uppercases a product's stock status so the UI's checks hold", async () => {
    // A transitional backend serialised the enum lowercase ("available"); the
    // detail page compares `status === "AVAILABLE"`, so normalise at the boundary.
    const products = [
      {
        slug: "cherries",
        name_en: "Cherries",
        group: "fruits",
        status: "seasonal",
        last_confirmed_at: null,
      },
      {
        slug: "apples",
        name_en: "Apples",
        group: "fruits",
        status: "unavailable",
        last_confirmed_at: null,
      },
    ] as unknown as FarmProduct[];
    mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ products })], next_cursor: null }),
    );

    const farms = await getFarms();

    expect(farms[0].products?.map((p) => p.status)).toEqual([
      "SEASONAL",
      "UNAVAILABLE",
    ]);
  });

  it("falls back to AVAILABLE for an unrecognised status", async () => {
    const products = [
      {
        slug: "kale",
        name_en: "Kale",
        group: "vegetables",
        status: "???",
        last_confirmed_at: null,
      },
    ] as unknown as FarmProduct[];
    mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ products })], next_cursor: null }),
    );

    const farms = await getFarms();

    expect(farms[0].products?.[0].status).toBe("AVAILABLE");
  });

  it("throws FarmsApiError on an unexpected shape", async () => {
    mockFetchSequence(jsonResponse({ nope: true }));
    await expect(getFarms()).rejects.toBeInstanceOf(FarmsApiError);
  });

  it("throws FarmsApiError on a non-OK status", async () => {
    mockFetchSequence(jsonResponse("boom", 500));
    await expect(getFarms()).rejects.toBeInstanceOf(FarmsApiError);
  });
});

describe("getFarms — cursor pagination", () => {
  it("follows next_cursor across pages and concatenates the results", async () => {
    const spy = mockFetchSequence(
      jsonResponse({
        farms: [makeFarm({ id: "f1" }), makeFarm({ id: "f2" })],
        // The backend's next_cursor is the next OFFSET to request.
        next_cursor: "100",
      }),
      jsonResponse({ farms: [makeFarm({ id: "f3" })], next_cursor: null }),
    );

    const farms = await getFarms();

    expect(farms.map((f) => f.id)).toEqual(["f1", "f2", "f3"]);
    expect(spy).toHaveBeenCalledTimes(2);
    // The first page carries no offset; the second forwards it as `offset=`
    // (the backend paginates by offset — `after=` would be silently ignored).
    expect(String(spy.mock.calls[0][0])).not.toContain("offset=");
    expect(String(spy.mock.calls[1][0])).toContain("offset=100");
  });

  it("dedupes farms that repeat across pages (defensive)", async () => {
    mockFetchSequence(
      jsonResponse({
        farms: [makeFarm({ id: "f1" }), makeFarm({ id: "f2" })],
        next_cursor: "100",
      }),
      // f2 repeats on the page boundary; it must appear once.
      jsonResponse({
        farms: [makeFarm({ id: "f2" }), makeFarm({ id: "f3" })],
        next_cursor: null,
      }),
    );

    const farms = await getFarms();
    expect(farms.map((f) => f.id)).toEqual(["f1", "f2", "f3"]);
  });

  it("stops after the first page when there is no cursor", async () => {
    const spy = mockFetchSequence(
      jsonResponse({ farms: [makeFarm()], next_cursor: null }),
    );

    await getFarms();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// Production on Vercel rendered "Service offline" with an empty directory while
// the identical code on Render was fine. The directory is ~3,155 farms and the
// backend caps a page at 100, so a full load is 32 sequential requests — and any
// single failure used to discard the other 31. Vercel's cross-provider hop to a
// free-tier backend that spins down made request #1 time out often enough to
// matter; Render's warm, co-located backend rarely did.
describe("getFarms — a degraded answer gets a degraded lifetime", () => {
  // The regression this pins: under the fetch options that `use cache`
  // replaced, only a SUCCESSFUL page response was ever cached, so a failed page
  // was retried on the next request. Caching the return value instead means a
  // truncated directory would be served to everyone for the full lifetime
  // unless each exit path chooses for itself.

  it("gives a complete walk the full lifetime", async () => {
    mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: null }),
    );

    await getFarms();

    expect(chosenRevalidate()).toBe(FULL_REVALIDATE);
  });

  it("gives a walk cut short by a failing page the degraded lifetime", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
    );
    spy.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));

    await getFarms();

    expect(chosenRevalidate()).toBe(DEGRADED_REVALIDATE);
  });

  it("gives a walk stopped by the page cap the degraded lifetime", async () => {
    // A backend that offers another page forever: only FARMS_MAX_PAGES can end
    // this walk, and what it collected is missing everything past the cap.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse({
        farms: [makeFarm({ id: `f${Math.random()}` })],
        next_cursor: "100",
      }),
    );

    await getFarms();

    expect(chosenRevalidate()).toBe(DEGRADED_REVALIDATE);
  });
});

describe("getFarmFacets — a failure must not disable filtering for everyone", () => {
  // `null` is read by app/[lang]/page.tsx as "do not filter server-side", so a
  // `null` cached for the full lifetime would make a shared /?canton=BE link
  // serve the entire directory until it expired.

  it("gives real facets the full lifetime", async () => {
    mockFetchSequence(
      jsonResponse({
        total: 1,
        cantons: [{ code: "BE", count: 1 }],
        categories: [{ slug: "fruit", count: 1 }],
      }),
    );

    await expect(getFarmFacets()).resolves.not.toBeNull();
    expect(chosenRevalidate()).toBe(FULL_REVALIDATE);
  });

  it("gives a failed lookup the degraded lifetime", async () => {
    mockFetchSequence(jsonResponse("nope", 500));

    await expect(getFarmFacets()).resolves.toBeNull();
    expect(chosenRevalidate()).toBe(DEGRADED_REVALIDATE);
  });

  it("gives an unparseable body the degraded lifetime", async () => {
    mockFetchSequence(jsonResponse({ unexpected: true }));

    await expect(getFarmFacets()).resolves.toBeNull();
    expect(chosenRevalidate()).toBe(DEGRADED_REVALIDATE);
  });
});

describe("getFarms — partial-failure tolerance", () => {
  it("serves the pages that arrived when a later page fails", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      jsonResponse({
        farms: [makeFarm({ id: "f1" }), makeFarm({ id: "f2" })],
        next_cursor: "100",
      }),
    );
    spy.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));

    const farms = await getFarms();

    // A directory missing its tail beats no directory at all.
    expect(farms.map((f) => f.id)).toEqual(["f1", "f2"]);
  });

  it("serves partial results when a later page returns a non-OK status", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
    );
    spy.mockResolvedValueOnce(jsonResponse("upstream boom", 502));

    const farms = await getFarms();
    expect(farms.map((f) => f.id)).toEqual(["f1"]);
  });

  it("serves partial results when a later page is malformed", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockResolvedValueOnce(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
    );
    spy.mockResolvedValueOnce(jsonResponse({ nope: true }));

    const farms = await getFarms();
    expect(farms.map((f) => f.id)).toEqual(["f1"]);
  });

  // With nothing at all we must still throw: an empty list is
  // indistinguishable from "there are no farms", and the caller has to be able
  // to show the error state rather than an innocuous empty directory.
  it("still throws when the very first page fails", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    await expect(getFarms()).rejects.toBeInstanceOf(FarmsApiError);
  });

  it("gives the first page a longer timeout than the rest", async () => {
    // Page 0 pays for waking a spun-down backend; later pages are hot. Spy on
    // AbortSignal.timeout so this asserts the actual budgets rather than just
    // "a signal was passed", which would hold no matter what the values were.
    const timeouts: number[] = [];
    const real = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms: number) => {
      timeouts.push(ms);
      return real(ms);
    });

    mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
      jsonResponse({ farms: [makeFarm({ id: "f2" })], next_cursor: null }),
    );

    await getFarms();

    expect(timeouts).toHaveLength(2);
    expect(timeouts[0]).toBeGreaterThan(timeouts[1]);
    expect(timeouts[0]).toBeGreaterThanOrEqual(15_000);
  });
});

// Per-request timeouts bound each hop, not the walk. 32 pages at 8s each is
// over four minutes — long past the point a serverless host kills the
// invocation, which surfaces as a hard platform error instead of the partial
// directory this function is meant to degrade into.
describe("getFarms — total pagination budget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops paging once the overall budget is spent and serves what it has", async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, "fetch");
    // A backend that always offers another page: only the budget can end this.
    spy.mockImplementation(async () => {
      // Each hop burns 6s of wall clock.
      vi.advanceTimersByTime(6_000);
      return jsonResponse({
        farms: [makeFarm({ id: `f${spy.mock.calls.length}` })],
        next_cursor: String(spy.mock.calls.length * 100),
      });
    });

    const farms = await getFarms();

    // Budget is 25s, so ~5 hops — nowhere near FARMS_MAX_PAGES (100).
    expect(spy.mock.calls.length).toBeGreaterThan(1);
    expect(spy.mock.calls.length).toBeLessThan(12);
    expect(farms.length).toBe(spy.mock.calls.length);
  });

  it("never asks for longer than the budget has left", async () => {
    vi.useFakeTimers();
    const timeouts: number[] = [];
    const real = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms: number) => {
      timeouts.push(ms);
      return real(ms);
    });
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockImplementation(async () => {
      // Fractional on purpose. In production `remaining` is a
      // performance.now() delta and is never a whole number; advancing by whole
      // milliseconds here would make the shortened budgets integers by
      // accident and hide the RangeError below.
      vi.advanceTimersByTime(9_000.4);
      return jsonResponse({
        farms: [makeFarm({ id: `f${spy.mock.calls.length}` })],
        next_cursor: String(spy.mock.calls.length * 100),
      });
    });

    await getFarms();

    // The last hop must not have been granted a full 8s when under 8s remained.
    expect(timeouts[timeouts.length - 1]).toBeLessThanOrEqual(8000);
    expect(Math.min(...timeouts)).toBeLessThan(8000);

    // And every one of them has to be an integer. `remaining` is a
    // performance.now() delta, so the shortened budgets are fractional, and
    // AbortSignal.timeout() throws a RangeError on a non-integer delay — which
    // failed the page outright instead of giving it less time.
    for (const ms of timeouts) {
      expect(Number.isInteger(ms)).toBe(true);
    }
  });
});

describe("getFarms — parallel pagination", () => {
  /** A full page, so the walk keeps going. */
  function fullPage(page: number, nextCursor: string | null) {
    return jsonResponse({
      farms: Array.from({ length: 100 }, (_, i) =>
        makeFarm({ id: `p${page}-${i}` }),
      ),
      next_cursor: nextCursor,
    });
  }

  it("requests later pages concurrently instead of one at a time", async () => {
    // 8 pages. Sequentially that is 8 round trips nose-to-tail; the ramp
    // (1 → 2 → 4) should overlap them into far fewer waves.
    let inFlight = 0;
    let peakInFlight = 0;
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockImplementation(async (input) => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      const offset = Number(
        new URL(input as URL | string).searchParams.get("offset") ?? "0",
      );
      const page = offset / 100;
      return fullPage(page, page < 7 ? String((page + 1) * 100) : null);
    });

    const farms = await getFarms();

    expect(farms).toHaveLength(800);
    // The whole point: more than one request was in the air at once.
    expect(peakInFlight).toBeGreaterThan(1);
    expect(spy).toHaveBeenCalledTimes(8);
  });

  it("does not overshoot on a directory that fits in two pages", async () => {
    // Speculation has to be paid for by the backend. A small directory must
    // still cost exactly the requests it needs — this is why the wave ramps
    // from one rather than opening at full width.
    const spy = mockFetchSequence(fullPage(0, "100"), fullPage(1, null));

    const farms = await getFarms();

    expect(farms).toHaveLength(200);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("keeps farms in page order however the requests resolve", async () => {
    // Wave members race. If the results were collected in completion order the
    // directory would reshuffle between loads for no reason a visitor could
    // perceive.
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockImplementation(async (input) => {
      const offset = Number(
        new URL(input as URL | string).searchParams.get("offset") ?? "0",
      );
      const page = offset / 100;
      // Later pages resolve *sooner*, inverting completion order.
      await new Promise((resolve) => setTimeout(resolve, (4 - page) * 5));
      return jsonResponse({
        farms: [makeFarm({ id: `page-${page}` })],
        next_cursor: page < 3 ? String((page + 1) * 100) : null,
      });
    });

    const farms = await getFarms();

    expect(farms.map((f) => f.id)).toEqual([
      "page-0",
      "page-1",
      "page-2",
      "page-3",
    ]);
  });

  it("falls back to following the cursor when offsets are not arithmetic", async () => {
    // If the backend ever stops paginating by a plain page-sized offset,
    // computing offsets ourselves would silently skip or duplicate farms.
    // Serving a slower-but-correct directory is the only acceptable answer.
    const spy = mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ id: "a" })], next_cursor: "opaque-1" }),
      jsonResponse({ farms: [makeFarm({ id: "b" })], next_cursor: null }),
    );

    const farms = await getFarms();

    expect(farms.map((f) => f.id)).toEqual(["a", "b"]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("serves the pages that did arrive when one in a wave fails", async () => {
    // A directory missing its tail beats no directory at all.
    const spy = vi.spyOn(globalThis, "fetch");
    spy.mockImplementation(async (input) => {
      const offset = Number(
        new URL(input as URL | string).searchParams.get("offset") ?? "0",
      );
      if (offset >= 200) {
        throw new Error("upstream exploded");
      }
      return fullPage(offset / 100, String(offset + 100));
    });

    const farms = await getFarms();

    expect(farms).toHaveLength(200);
  });
});

describe("toDirectoryFarm", () => {
  it("drops products, which the directory never reads", async () => {
    const { toDirectoryFarm } = await import("@/lib/directory");
    const withProducts = makeFarm({
      products: [
        {
          slug: "apples",
          name_en: "Apples",
          group: "fruits",
          status: "AVAILABLE",
          last_confirmed_at: null,
        } satisfies FarmProduct,
      ],
    });

    const lite = toDirectoryFarm(withProducts);

    // Asserted on the serialised form: `DirectoryFarm` no longer *has* a
    // `products` property, so reading one is a compile error — which is the
    // guarantee this projection is supposed to provide.
    expect(Object.keys(lite)).not.toContain("products");
    expect(JSON.parse(JSON.stringify(lite)).products).toBeUndefined();
    // Everything the cards and filters do read survives.
    expect(lite).toMatchObject({
      id: withProducts.id,
      name: withProducts.name,
      canton: withProducts.canton,
      coordinates: withProducts.coordinates,
      categories: withProducts.categories,
      created_at: withProducts.created_at,
      address: withProducts.address,
    });
  });

  it("is dramatically smaller on a realistic farm", async () => {
    const { toDirectoryFarm } = await import("@/lib/directory");
    const farm = makeFarm({
      products: Array.from({ length: 12 }, (_, i) => ({
        slug: `product-${i}`,
        name_en: `Product ${i}`,
        group: "vegetables",
        status: "AVAILABLE" as const,
        last_confirmed_at: "2026-07-14T10:00:00Z",
      })),
    });

    const before = JSON.stringify(farm).length;
    const after = JSON.stringify(toDirectoryFarm(farm)).length;

    // The payload is serialised into the page and JSON-parsed on the main
    // thread before hydration finishes, so this ratio is felt directly.
    expect(after * 4).toBeLessThan(before);
  });
});

describe("getFarmById", () => {
  it("asks the single-farm endpoint, not the list", async () => {
    const spy = mockFetchSequence(jsonResponse({ ...makeFarm(), lang: "en" }));

    const farm = await getFarmById("f1");

    expect(farm?.id).toBe("f1");
    expect(spy).toHaveBeenCalledTimes(1);
    const url = new URL(String(spy.mock.calls[0][0]));
    expect(url.pathname).toMatch(/\/farms\/f1$/);
  });

  it("passes the locale through so labels come back translated", async () => {
    const spy = mockFetchSequence(jsonResponse({ ...makeFarm(), lang: "de" }));
    await getFarmById("f1", "de");
    expect(new URL(String(spy.mock.calls[0][0])).searchParams.get("lang")).toBe(
      "de",
    );
  });

  it("encodes the id rather than splicing it into the path", async () => {
    // Ids come from the URL. One with a slash or a query character must not be
    // able to reshape the request.
    const spy = mockFetchSequence(jsonResponse({ ...makeFarm({ id: "a/b" }) }));
    await getFarmById("a/b");
    expect(String(spy.mock.calls[0][0])).toContain("a%2Fb");
  });

  it("returns null for 404 instead of throwing", async () => {
    // A missing farm is a routing outcome, not a service failure.
    mockFetchSequence(new Response(null, { status: 404 }));
    await expect(getFarmById("nope")).resolves.toBeNull();
  });

  it("throws on a real failure so an outage is not shown as a 404", async () => {
    mockFetchSequence(jsonResponse({ message: "boom" }, 500));
    await expect(getFarmById("f1")).rejects.toBeInstanceOf(FarmsApiError);
  });

  it("rejects a response that is not a farm", async () => {
    // The detail endpoint flattens the farm into the body. If that ever became
    // an envelope, every field would read as undefined and render blank — this
    // must fail loudly instead.
    mockFetchSequence(jsonResponse({ farm: makeFarm() }));
    await expect(getFarmById("f1")).rejects.toBeInstanceOf(FarmsApiError);
  });

  it("normalises categories and stock status like the list does", async () => {
    // The backend returns English group slugs; the boundary folds them to the
    // German catalog keys the UI indexes by, so a farm fetched by id and the
    // same farm from the list are described identically.
    const raw = {
      ...makeFarm({ categories: ["fruits", "dairy"] }),
      products: [
        {
          slug: "apples",
          name_en: "Apples",
          group: "fruits",
          status: "available",
          last_confirmed_at: null,
        },
      ],
      lang: "en",
    };
    mockFetchSequence(jsonResponse(raw));

    const farm = await getFarmById("f1");

    expect(farm?.products?.[0].status).toBe("AVAILABLE");
    expect(farm?.categories).toEqual(["Früchte", "Milchprodukte"]);
  });
});
