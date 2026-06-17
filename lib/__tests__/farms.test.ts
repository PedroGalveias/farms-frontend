import { describe, expect, it } from "vitest";
import {
  formatFarmDate,
  getCantonName,
  getTopFarmCategories,
  getUniqueFarmCantons,
  getUniqueFarmCategories,
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
