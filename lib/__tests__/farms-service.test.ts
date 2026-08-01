import { afterEach, describe, expect, it, vi } from "vitest";
import { FarmsApiError, getFarmTaxonomy, getFarms } from "@/lib/farms-service";
import type { Farm, FarmProduct } from "@/types/farm";

afterEach(() => {
  vi.restoreAllMocks();
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
  it("sends the active locale on every page", async () => {
    const spy = mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
      jsonResponse({ farms: [makeFarm({ id: "f2" })], next_cursor: null }),
    );

    await getFarms("fr");

    expect(spy).toHaveBeenCalledTimes(2);
    for (const [request] of spy.mock.calls) {
      expect(new URL(String(request)).searchParams.get("lang")).toBe("fr");
    }
  });

  it("forwards supported directory filters on every page", async () => {
    const spy = mockFetchSequence(
      jsonResponse({ farms: [makeFarm({ id: "f1" })], next_cursor: "100" }),
      jsonResponse({ farms: [makeFarm({ id: "f2" })], next_cursor: null }),
    );

    await getFarms("de", {
      canton: "BE",
      categories: ["fruits", "vegetables"],
      q: "  berry farm  ",
      sort: "name",
    });

    for (const [request] of spy.mock.calls) {
      const params = new URL(String(request)).searchParams;
      expect(params.get("lang")).toBe("de");
      expect(params.get("canton")).toBe("BE");
      expect(params.get("category")).toBe("fruits,vegetables");
      expect(params.get("q")).toBe("berry farm");
      expect(params.get("sort")).toBe("name");
    }
  });

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

describe("getFarmTaxonomy", () => {
  it("requests and validates the localized taxonomy contract", async () => {
    const spy = mockFetchSequence(
      jsonResponse({
        lang: "fr",
        categories: [{ slug: "vegetables", name: "Légumes", translated: true }],
        products: [
          {
            slug: "apples",
            name: "Apples",
            translated: false,
            category: "fruits",
          },
        ],
      }),
    );

    const taxonomy = await getFarmTaxonomy("fr");

    expect(
      new URL(String(spy.mock.calls[0]?.[0])).searchParams.get("lang"),
    ).toBe("fr");
    expect(taxonomy).toEqual({
      lang: "fr",
      categories: [{ slug: "vegetables", name: "Légumes", translated: true }],
      products: [
        {
          slug: "apples",
          name: "Apples",
          translated: false,
          category: "fruits",
        },
      ],
    });
  });

  it("rejects a malformed taxonomy response", async () => {
    mockFetchSequence(
      jsonResponse({ lang: "fr", categories: [], products: [{}] }),
    );

    await expect(getFarmTaxonomy("fr")).rejects.toBeInstanceOf(FarmsApiError);
  });
});

// Production on Vercel rendered "Service offline" with an empty directory while
// the identical code on Render was fine. The directory is ~3,155 farms and the
// backend caps a page at 100, so a full load is 32 sequential requests — and any
// single failure used to discard the other 31. Vercel's cross-provider hop to a
// free-tier backend that spins down made request #1 time out often enough to
// matter; Render's warm, co-located backend rarely did.
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
      vi.advanceTimersByTime(9_000);
      return jsonResponse({
        farms: [makeFarm({ id: `f${spy.mock.calls.length}` })],
        next_cursor: String(spy.mock.calls.length * 100),
      });
    });

    await getFarms();

    // The last hop must not have been granted a full 8s when under 8s remained.
    expect(timeouts[timeouts.length - 1]).toBeLessThanOrEqual(8000);
    expect(Math.min(...timeouts)).toBeLessThan(8000);
  });
});
