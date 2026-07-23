import { afterEach, describe, expect, it, vi } from "vitest";
import { FarmsApiError, getFarms } from "@/lib/farms-service";
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
