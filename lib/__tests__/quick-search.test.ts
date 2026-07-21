import { beforeEach, describe, expect, it } from "vitest";
import {
  formatQuickSearchDistance,
  getNearestFarm,
  getNearestFarms,
  getQuickSearchProducts,
  getQuickSearchResults,
  parseQuickSearchCoordinates,
  productMatchesCategory,
  LAST_SEARCH_STORAGE_KEY,
  readLastQuickSearch,
  writeLastQuickSearch,
} from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
    name: "Test Farm",
    address: "Main Street 1, 3000 Bern",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("parseQuickSearchCoordinates", () => {
  it("parses comma-separated coordinates", () => {
    expect(parseQuickSearchCoordinates("46.948,7.447")).toEqual({
      latitude: 46.948,
      longitude: 7.447,
    });
  });

  it("parses semicolon-separated and whitespace-padded input", () => {
    expect(parseQuickSearchCoordinates("  -12.5 ; 100.25 ")).toEqual({
      latitude: -12.5,
      longitude: 100.25,
    });
  });

  it("rejects non-coordinate strings", () => {
    expect(parseQuickSearchCoordinates("Bern")).toBeNull();
    expect(parseQuickSearchCoordinates("")).toBeNull();
  });

  it("rejects out-of-range latitude/longitude", () => {
    expect(parseQuickSearchCoordinates("91,7")).toBeNull();
    expect(parseQuickSearchCoordinates("46,181")).toBeNull();
  });
});

describe("productMatchesCategory", () => {
  it("matches case-insensitively and folds diacritics", () => {
    expect(productMatchesCategory("vegetables", "Vegetables")).toBe(true);
    expect(productMatchesCategory("Gemüse", "gemuse")).toBe(true);
  });

  it("normalizes singular/plural synonyms", () => {
    expect(productMatchesCategory("egg", "Eggs")).toBe(true);
    expect(productMatchesCategory("fruit", "Fruits")).toBe(true);
  });

  it("does not match unrelated products", () => {
    expect(productMatchesCategory("Dairy", "Vegetables")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(productMatchesCategory("", "Vegetables")).toBe(false);
    expect(productMatchesCategory("Dairy", "")).toBe(false);
  });
});

describe("getNearestFarm", () => {
  const near = makeFarm({ id: "near", coordinates: "46.95,7.45" });
  const far = makeFarm({ id: "far", coordinates: "47.3769,8.5417" });

  it("returns the closest farm with its distance", () => {
    const result = getNearestFarm([far, near], {
      latitude: 46.95,
      longitude: 7.45,
    });
    expect(result?.farm.id).toBe("near");
    expect(result?.distanceKm).toBeGreaterThanOrEqual(0);
    expect(result?.distanceKm).toBeLessThan(1);
  });

  it("skips farms with unparseable coordinates", () => {
    const broken = makeFarm({ id: "broken", coordinates: "not-a-coord" });
    const result = getNearestFarm([broken, far], {
      latitude: 47.37,
      longitude: 8.54,
    });
    expect(result?.farm.id).toBe("far");
  });

  it("returns null when no farm has valid coordinates", () => {
    const broken = makeFarm({ coordinates: "x" });
    expect(getNearestFarm([broken], { latitude: 46, longitude: 7 })).toBeNull();
    expect(getNearestFarm([], { latitude: 46, longitude: 7 })).toBeNull();
  });
});

describe("getNearestFarms", () => {
  const a = makeFarm({ id: "a", coordinates: "46.95,7.45" }); // closest
  const b = makeFarm({ id: "b", coordinates: "46.96,7.46" });
  const c = makeFarm({ id: "c", coordinates: "47.3769,8.5417" }); // farthest
  const broken = makeFarm({ id: "broken", coordinates: "nope" });

  it("returns farms sorted nearest-first, limited", () => {
    const result = getNearestFarms([c, broken, b, a], {
      latitude: 46.95,
      longitude: 7.45,
    });
    expect(result.map((r) => r.farm.id)).toEqual(["a", "b", "c"]);
    expect(result[0].distanceKm).toBeLessThanOrEqual(result[1].distanceKm);
  });

  it("honors the limit and skips unparseable coordinates", () => {
    const result = getNearestFarms(
      [c, broken, b, a],
      { latitude: 46.95, longitude: 7.45 },
      2,
    );
    expect(result.map((r) => r.farm.id)).toEqual(["a", "b"]);
  });

  it("returns an empty array when nothing has coordinates", () => {
    expect(getNearestFarms([broken], { latitude: 46, longitude: 7 })).toEqual(
      [],
    );
  });
});

describe("getQuickSearchResults", () => {
  const bern = makeFarm({
    id: "bern",
    name: "Bern Farm",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables", "Dairy"],
  });
  const zurich = makeFarm({
    id: "zurich",
    name: "Zurich Farm",
    canton: "ZH",
    address: "Feldweg 3, 8001 Zürich",
    coordinates: "47.3769,8.5417",
    categories: ["Vegetables"],
  });

  it("returns nothing when no products are selected", () => {
    expect(
      getQuickSearchResults({
        farms: [bern, zurich],
        location: { coordinates: null, label: "" },
        matchMode: "any",
        selectedProducts: [],
      }),
    ).toEqual([]);
  });

  it("sorts by distance, nearest first, when coordinates are given", () => {
    const results = getQuickSearchResults({
      farms: [zurich, bern],
      location: {
        coordinates: { latitude: 46.95, longitude: 7.45 },
        label: "",
      },
      matchMode: "any",
      selectedProducts: ["Vegetables"],
    });
    expect(results.map((r) => r.farm.id)).toEqual(["bern", "zurich"]);
    expect(results[0].distanceKm).toBeLessThan(results[1].distanceKm!);
  });

  it("matchMode 'all' requires every selected product", () => {
    const results = getQuickSearchResults({
      farms: [bern, zurich],
      location: { coordinates: null, label: "" },
      matchMode: "all",
      selectedProducts: ["Vegetables", "Dairy"],
    });
    expect(results.map((r) => r.farm.id)).toEqual(["bern"]);
  });

  it("matchMode 'any' includes farms with at least one product", () => {
    const results = getQuickSearchResults({
      farms: [bern, zurich],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Vegetables", "Dairy"],
    });
    expect(results.map((r) => r.farm.id).sort()).toEqual(["bern", "zurich"]);
  });

  it("matches a specific product (subcategory) via its parent group", () => {
    // Farms store group-level categories; selecting the product "Tomaten"
    // (group Gemüse) should still match a farm tagged with the group.
    const gemueseFarm = makeFarm({ id: "g", categories: ["Gemüse"] });
    const results = getQuickSearchResults({
      farms: [gemueseFarm],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Tomaten"],
    });
    expect(results.map((r) => r.farm.id)).toEqual(["g"]);
  });

  it("ranks text-location matches by relevance score", () => {
    const results = getQuickSearchResults({
      farms: [bern, zurich],
      location: { coordinates: null, label: "Zürich" },
      matchMode: "any",
      selectedProducts: ["Vegetables"],
    });
    expect(results[0].farm.id).toBe("zurich");
    expect(results[0].locationScore).toBeGreaterThan(results[1].locationScore);
  });
});

describe("getQuickSearchProducts", () => {
  it("derives categories from the farm data and counts farms", () => {
    const products = getQuickSearchProducts([
      makeFarm({ categories: ["Gemüse"] }),
      makeFarm({ categories: ["Gemüse", "Milchprodukte"] }),
    ]);
    const vegetables = products.find((p) => p.category === "Gemüse");
    const dairy = products.find((p) => p.category === "Milchprodukte");
    expect(vegetables?.farmCount).toBe(2);
    expect(dairy?.farmCount).toBe(1);
    // Only categories present in the data appear — nothing is hardcoded.
    expect(products).toHaveLength(2);
  });

  it("returns an empty list when the data has no categories", () => {
    expect(getQuickSearchProducts([])).toEqual([]);
    expect(getQuickSearchProducts([makeFarm({ categories: [] })])).toEqual([]);
  });

  it("sorts by farm count descending", () => {
    const products = getQuickSearchProducts([
      makeFarm({ categories: ["Milchprodukte"] }),
      makeFarm({ categories: ["Milchprodukte"] }),
      makeFarm({ categories: ["Gemüse"] }),
    ]);
    expect(products[0].category).toBe("Milchprodukte");
  });
});

describe("formatQuickSearchDistance", () => {
  it("returns null for null distance", () => {
    expect(formatQuickSearchDistance(null)).toBeNull();
  });

  it("renders sub-kilometre, one-decimal, and rounded ranges", () => {
    expect(formatQuickSearchDistance(0.4)).toBe("Less than 1 km away");
    expect(formatQuickSearchDistance(3.45)).toBe("3.5 km away");
    expect(formatQuickSearchDistance(42.6)).toBe("43 km away");
  });
});

describe("last quick search persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips products and match mode", () => {
    writeLastQuickSearch({ matchMode: "any", products: ["Käse", "Honig"] });
    expect(readLastQuickSearch()).toEqual({
      matchMode: "any",
      products: ["Käse", "Honig"],
    });
  });

  it("returns null when nothing is stored or products are empty", () => {
    expect(readLastQuickSearch()).toBeNull();
    writeLastQuickSearch({ matchMode: "all", products: [] });
    expect(readLastQuickSearch()).toBeNull();
  });

  it("survives corrupt JSON and strips junk entries", () => {
    window.localStorage.setItem(LAST_SEARCH_STORAGE_KEY, "{not json");
    expect(readLastQuickSearch()).toBeNull();
    window.localStorage.setItem(
      LAST_SEARCH_STORAGE_KEY,
      JSON.stringify({ matchMode: "weird", products: ["ok", 7, ""] }),
    );
    expect(readLastQuickSearch()).toEqual({
      matchMode: "all",
      products: ["ok"],
    });
  });
});

describe("getQuickSearchResults — precise product matching", () => {
  const withStrawberries = makeFarm({
    id: "straw",
    categories: ["Früchte"],
    products: [
      {
        slug: "strawberries",
        name_en: "Strawberries",
        group: "fruits",
        status: "AVAILABLE",
        last_confirmed_at: null,
      },
    ],
  });
  const withCherries = makeFarm({
    id: "cherry",
    categories: ["Früchte"],
    products: [
      {
        slug: "cherries",
        name_en: "Cherries",
        group: "fruits",
        status: "AVAILABLE",
        last_confirmed_at: null,
      },
    ],
  });

  it("matches only farms that actually list the selected product", () => {
    const results = getQuickSearchResults({
      farms: [withStrawberries, withCherries],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Erdbeeren"], // strawberries
    });
    expect(results.map((r) => r.farm.id)).toEqual(["straw"]);
  });

  it("a farm with an empty products list matches no product", () => {
    const barren = makeFarm({
      id: "barren",
      categories: ["Früchte"],
      products: [],
    });
    const results = getQuickSearchResults({
      farms: [barren],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Erdbeeren"],
    });
    expect(results).toEqual([]);
  });

  it("falls back to category rollup when products data is absent", () => {
    // No `products` field → current backend behaviour: any fruit farm matches a
    // fruit product selection (zero regression until real product data lands).
    const noProductData = makeFarm({ id: "legacy", categories: ["Früchte"] });
    const results = getQuickSearchResults({
      farms: [noProductData],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Erdbeeren"],
    });
    expect(results.map((r) => r.farm.id)).toEqual(["legacy"]);
  });

  it("a group selection still matches group-only farms via categories", () => {
    const results = getQuickSearchResults({
      farms: [withCherries],
      location: { coordinates: null, label: "" },
      matchMode: "any",
      selectedProducts: ["Früchte"], // group, not a product
    });
    expect(results.map((r) => r.farm.id)).toEqual(["cherry"]);
  });
});
