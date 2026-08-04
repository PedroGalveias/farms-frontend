import { describe, expect, it } from "vitest";
import {
  facetsFromApi,
  facetsFromFarms,
  parseApiFacets,
} from "@/lib/directory-facets";
import type { Farm } from "@/types/farm";

const farm = (over: Partial<Farm> = {}): Farm => ({
  id: crypto.randomUUID(),
  name: "Hof",
  address: "Dorfstrasse 1",
  canton: "BE",
  coordinates: "46.9,7.4",
  categories: ["Früchte"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
  ...over,
});

describe("parseApiFacets", () => {
  it("accepts a well-formed body", () => {
    expect(
      parseApiFacets({
        total: 3,
        cantons: [{ code: "BE", count: 2 }],
        categories: [{ slug: "fruits", name: "Fruits", count: 1 }],
      }),
    ).not.toBeNull();
  });

  it.each([
    ["not an object", 42],
    ["null", null],
    ["a missing total", { cantons: [], categories: [] }],
    ["a non-array cantons", { total: 0, cantons: {}, categories: [] }],
    [
      "a canton without a count",
      { total: 0, cantons: [{ code: "BE" }], categories: [] },
    ],
    [
      "a category without a slug",
      { total: 0, cantons: [], categories: [{ name: "Fruits", count: 1 }] },
    ],
  ])("returns null for %s", (_label, body) => {
    // Null, never a throw: facets are an optimisation, and the caller falls
    // back to counting the farms it already has.
    expect(parseApiFacets(body)).toBeNull();
  });
});

describe("facetsFromApi", () => {
  it("folds API slugs to the canonical keys the directory displays", () => {
    const facets = facetsFromApi({
      total: 10,
      cantons: [{ code: "BE", count: 10 }],
      categories: [
        { slug: "fruits", name: "Fruits", count: 4 },
        { slug: "dairy", name: "Dairy", count: 6 },
      ],
    });

    // The API speaks slugs; chips, icons and counts all speak German keys.
    expect(facets.categories).toEqual(["Früchte", "Milchprodukte"]);
    expect(facets.categoryCounts).toEqual({ Früchte: 4, Milchprodukte: 6 });
    expect(facets.total).toBe(10);
  });

  it("sums two slugs that fold to the same canonical key", () => {
    const facets = facetsFromApi({
      total: 5,
      cantons: [],
      categories: [
        { slug: "bakery", name: "Bakery", count: 2 },
        { slug: "Backwaren", name: "Backwaren", count: 3 },
      ],
    });

    expect(facets.categoryCounts["Backwaren und Gebäck"]).toBe(5);
  });

  it("drops options nothing is behind", () => {
    const facets = facetsFromApi({
      total: 1,
      cantons: [
        { code: "BE", count: 1 },
        { code: "ZH", count: 0 },
      ],
      categories: [
        { slug: "fruits", name: "Fruits", count: 1 },
        { slug: "fish-seafood", name: "Fish", count: 0 },
      ],
    });

    // The API is exhaustive so a client *can* grey options out; this directory
    // has always listed only what has farms.
    expect(facets.cantons).toEqual(["BE"]);
    expect(facets.categories).toEqual(["Früchte"]);
  });
});

describe("facetsFromFarms", () => {
  it("produces the same shape from a farm list", () => {
    const facets = facetsFromFarms([
      farm({ canton: "BE", categories: ["Früchte"] }),
      farm({ canton: "ZH", categories: ["Früchte", "Gemüse"] }),
    ]);

    expect(facets.cantons).toEqual(["BE", "ZH"]);
    expect(facets.categoryCounts).toEqual({ Früchte: 2, Gemüse: 1 });
    expect(facets.total).toBe(2);
  });

  it("agrees with the API path given equivalent data", () => {
    const fromFarms = facetsFromFarms([
      farm({ canton: "BE", categories: ["Früchte"] }),
      farm({ canton: "BE", categories: ["Gemüse"] }),
    ]);
    const fromApi = facetsFromApi({
      total: 2,
      cantons: [{ code: "BE", count: 2 }],
      categories: [
        { slug: "fruits", name: "Fruits", count: 1 },
        { slug: "vegetables", name: "Vegetables", count: 1 },
      ],
    });

    // The two paths have to be interchangeable, or swapping to the endpoint
    // would quietly change what the picker offers.
    expect(fromApi).toEqual(fromFarms);
  });
});
