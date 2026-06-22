import { describe, expect, it } from "vitest";
import { SWITZERLAND_BOUNDS, toFarmPoints } from "@/lib/map";
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

describe("toFarmPoints", () => {
  it("maps farms with valid coordinates to points", () => {
    const farm = makeFarm();
    const points = toFarmPoints([farm]);

    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({
      farm,
      latitude: 46.948,
      longitude: 7.4474,
    });
  });

  it("drops farms with missing or malformed coordinates", () => {
    const points = toFarmPoints([
      makeFarm({ id: "a", coordinates: "" }),
      makeFarm({ id: "b", coordinates: "not-a-coordinate" }),
      makeFarm({ id: "c", coordinates: "46.0,8.0" }),
    ]);

    expect(points.map((point) => point.farm.id)).toEqual(["c"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(toFarmPoints([])).toEqual([]);
  });

  it("exposes a Switzerland bounding box that is well-formed", () => {
    expect(SWITZERLAND_BOUNDS.south).toBeLessThan(SWITZERLAND_BOUNDS.north);
    expect(SWITZERLAND_BOUNDS.west).toBeLessThan(SWITZERLAND_BOUNDS.east);
  });
});
