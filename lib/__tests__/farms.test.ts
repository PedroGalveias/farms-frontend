import { describe, expect, it } from "vitest";
import {
  formatFarmDate,
  getCantonName,
  getCantonsInRegion,
  getRegionKeyForCanton,
  getRegionKeys,
  getTopFarmCategories,
  getUniqueFarmCantons,
  getUniqueFarmCategories,
  groupCantonsByRegion,
  isValidCantonCode,
  splitCoordinates,
} from "@/lib/farms";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
    name: "Test Farm",
    address: "Main Street 1",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("getCantonName", () => {
  it("resolves a known code (case-insensitive)", () => {
    expect(getCantonName("ZH")).toBe("Zurich");
    expect(getCantonName("zh")).toBe("Zurich");
  });

  it("falls back to the raw code when unknown", () => {
    expect(getCantonName("XX")).toBe("XX");
  });
});

describe("formatFarmDate", () => {
  it("formats an ISO date in en-CH short form", () => {
    expect(formatFarmDate("2026-02-02T10:00:00Z")).toBe("2 Feb 2026");
  });
});

describe("splitCoordinates", () => {
  it("splits and trims latitude/longitude", () => {
    expect(splitCoordinates("46.9480, 7.4474")).toEqual({
      latitude: "46.9480",
      longitude: "7.4474",
    });
  });

  it("handles missing parts gracefully", () => {
    expect(splitCoordinates("")).toEqual({ latitude: "", longitude: "" });
  });
});

describe("getUniqueFarmCantons", () => {
  it("returns sorted, de-duplicated cantons", () => {
    const cantons = getUniqueFarmCantons([
      makeFarm({ canton: "ZH" }),
      makeFarm({ canton: "BE" }),
      makeFarm({ canton: "ZH" }),
    ]);
    expect(cantons).toEqual(["BE", "ZH"]);
  });
});

describe("getUniqueFarmCategories", () => {
  it("flattens, de-duplicates, and sorts categories", () => {
    const categories = getUniqueFarmCategories([
      makeFarm({ categories: ["Vegetables", "Dairy"] }),
      makeFarm({ categories: ["Dairy", "Fruits"] }),
    ]);
    expect(categories).toEqual(["Dairy", "Fruits", "Vegetables"]);
  });
});

describe("getTopFarmCategories", () => {
  it("ranks categories by frequency then alphabetically", () => {
    const top = getTopFarmCategories(
      [
        makeFarm({ categories: ["Dairy", "Vegetables"] }),
        makeFarm({ categories: ["Dairy"] }),
        makeFarm({ categories: ["Fruits"] }),
      ],
      2,
    );
    expect(top).toEqual(["Dairy", "Fruits"]);
  });

  it("respects the limit", () => {
    const top = getTopFarmCategories(
      [makeFarm({ categories: ["A", "B", "C", "D"] })],
      2,
    );
    expect(top).toHaveLength(2);
  });
});

describe("groupCantonsByRegion", () => {
  it("buckets cantons into great regions, dropping empty regions", () => {
    const groups = groupCantonsByRegion(["ZH", "VD", "GE"]);
    expect(groups).toEqual([
      { key: "region_leman", cantons: ["GE", "VD"] },
      { key: "region_zurich", cantons: ["ZH"] },
    ]);
  });

  it("collects unmapped codes under region_other", () => {
    const groups = groupCantonsByRegion(["ZH", "XX"]);
    expect(groups).toContainEqual({ key: "region_other", cantons: ["XX"] });
  });

  it("returns nothing for an empty input", () => {
    expect(groupCantonsByRegion([])).toEqual([]);
  });
});

describe("canton/region helpers", () => {
  it("validates canton codes case-insensitively", () => {
    expect(isValidCantonCode("BE")).toBe(true);
    expect(isValidCantonCode("be")).toBe(true);
    expect(isValidCantonCode("ZH")).toBe(true);
    expect(isValidCantonCode("XX")).toBe(false);
    expect(isValidCantonCode("")).toBe(false);
  });

  it("maps a canton to its region", () => {
    expect(getRegionKeyForCanton("GE")).toBe("region_leman");
    expect(getRegionKeyForCanton("zh")).toBe("region_zurich");
    expect(getRegionKeyForCanton("TI")).toBe("region_ticino");
    expect(getRegionKeyForCanton("XX")).toBe("region_other");
  });

  it("lists cantons in a region and exposes all region keys", () => {
    expect(getCantonsInRegion("region_leman")).toEqual(["GE", "VD", "VS"]);
    expect(getCantonsInRegion("nope")).toEqual([]);
    const keys = getRegionKeys();
    expect(keys).toContain("region_zurich");
    expect(keys).toHaveLength(7);
  });
});
