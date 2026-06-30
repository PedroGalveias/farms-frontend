import { describe, expect, it } from "vitest";
import {
  RADIUS_OPTIONS,
  farmDistanceKm,
  formatDistanceShort,
  getCantonCounts,
  getCategoryCounts,
  isRecentlyAdded,
  matchesCanton,
  matchesCategories,
  matchesSearch,
  withinRadius,
} from "@/lib/directory";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
    name: "Test Farm",
    address: "Main Street 1",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Gemüse"],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("matchesCategories", () => {
  it("matches every farm when nothing is selected", () => {
    expect(matchesCategories(makeFarm(), [], "all")).toBe(true);
    expect(matchesCategories(makeFarm(), [], "any")).toBe(true);
  });

  it("requires all selected groups in 'all' mode", () => {
    const farm = makeFarm({ categories: ["Gemüse", "Früchte"] });
    expect(matchesCategories(farm, ["Gemüse", "Früchte"], "all")).toBe(true);
    expect(matchesCategories(farm, ["Gemüse", "Eier"], "all")).toBe(false);
  });

  it("requires at least one selected group in 'any' mode", () => {
    const farm = makeFarm({ categories: ["Gemüse"] });
    expect(matchesCategories(farm, ["Eier", "Gemüse"], "any")).toBe(true);
    expect(matchesCategories(farm, ["Eier", "Früchte"], "any")).toBe(false);
  });
});

describe("matchesSearch", () => {
  it("matches everything for an empty query", () => {
    expect(matchesSearch(makeFarm(), "")).toBe(true);
  });

  it("matches on name, address, or a category string", () => {
    expect(matchesSearch(makeFarm({ name: "Hofgut" }), "hofg")).toBe(true);
    expect(
      matchesSearch(makeFarm({ address: "Bahnhofstrasse" }), "bahnhof"),
    ).toBe(true);
    expect(matchesSearch(makeFarm({ categories: ["Gemüse"] }), "gemü")).toBe(
      true,
    );
    expect(matchesSearch(makeFarm({ name: "Hof" }), "zürich")).toBe(false);
  });
});

describe("matchesCanton", () => {
  it("matches all cantons for 'all'", () => {
    expect(matchesCanton(makeFarm({ canton: "BE" }), "all")).toBe(true);
  });

  it("matches only the selected canton", () => {
    expect(matchesCanton(makeFarm({ canton: "BE" }), "BE")).toBe(true);
    expect(matchesCanton(makeFarm({ canton: "BE" }), "ZH")).toBe(false);
  });
});

describe("withinRadius", () => {
  it("always passes when no radius is set", () => {
    expect(withinRadius(null, null)).toBe(true);
    expect(withinRadius(42, null)).toBe(true);
  });

  it("requires a known distance within the radius", () => {
    expect(withinRadius(9.9, 10)).toBe(true);
    expect(withinRadius(10, 10)).toBe(true);
    expect(withinRadius(10.1, 10)).toBe(false);
    expect(withinRadius(null, 10)).toBe(false);
  });
});

describe("facet counts", () => {
  it("counts farms per category group (rolled up)", () => {
    const counts = getCategoryCounts([
      makeFarm({ categories: ["Gemüse", "Früchte"] }),
      makeFarm({ categories: ["Gemüse"] }),
    ]);
    expect(counts["Gemüse"]).toBe(2);
    expect(counts["Früchte"]).toBe(1);
  });

  it("counts farms per canton", () => {
    const counts = getCantonCounts([
      makeFarm({ canton: "BE" }),
      makeFarm({ canton: "BE" }),
      makeFarm({ canton: "ZH" }),
    ]);
    expect(counts).toEqual({ BE: 2, ZH: 1 });
  });
});

describe("farmDistanceKm", () => {
  it("returns 0 for the same point", () => {
    const farm = makeFarm({ coordinates: "46.9480,7.4474" });
    expect(farmDistanceKm(farm, { latitude: 46.948, longitude: 7.4474 })).toBe(
      0,
    );
  });

  it("returns a positive distance for distinct points", () => {
    const farm = makeFarm({ coordinates: "47.3769,8.5417" }); // Zürich
    const km = farmDistanceKm(farm, { latitude: 46.948, longitude: 7.4474 }); // Bern
    expect(km).not.toBeNull();
    expect(km!).toBeGreaterThan(80);
    expect(km!).toBeLessThan(130);
  });

  it("returns null for unparseable coordinates", () => {
    const farm = makeFarm({ coordinates: "not-coords" });
    expect(farmDistanceKm(farm, { latitude: 46.9, longitude: 7.4 })).toBeNull();
  });
});

describe("formatDistanceShort", () => {
  it("formats sub-kilometre, single-digit, and large distances", () => {
    expect(formatDistanceShort(0.4)).toBe("< 1 km");
    expect(formatDistanceShort(5.42)).toBe("5.4 km");
    expect(formatDistanceShort(12.6)).toBe("13 km");
  });
});

describe("isRecentlyAdded", () => {
  const now = new Date("2026-06-22T12:00:00Z");

  it("is true within the last 30 days — including across a month boundary", () => {
    expect(isRecentlyAdded("2026-06-20T00:00:00Z", now)).toBe(true);
    // 25 days ago, in the previous calendar month — still recent.
    expect(isRecentlyAdded("2026-05-28T12:00:00Z", now)).toBe(true);
  });

  it("is false past 30 days, for the future, or bad input", () => {
    expect(isRecentlyAdded("2026-05-10T00:00:00Z", now)).toBe(false); // 43 days
    expect(isRecentlyAdded("2026-07-01T00:00:00Z", now)).toBe(false); // future
    expect(isRecentlyAdded("not-a-date", now)).toBe(false);
  });
});

describe("RADIUS_OPTIONS", () => {
  it("offers ascending km choices", () => {
    expect([...RADIUS_OPTIONS]).toEqual([10, 25, 50]);
  });
});
