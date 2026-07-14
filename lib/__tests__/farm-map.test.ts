import { describe, expect, it } from "vitest";
import {
  buildFarmMapPoints,
  CH_MAP_ASPECT,
  projectToSwissMap,
} from "@/lib/farm-map";
import type { Farm } from "@/types/farm";

const farm = (id: string, coordinates: string): Farm => ({
  id,
  name: `Farm ${id}`,
  address: "Somewhere 1",
  canton: "BE",
  coordinates,
  categories: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
});

describe("projectToSwissMap", () => {
  it("maps Bern near the centre of the unit square", () => {
    const point = projectToSwissMap(46.948, 7.4474);
    expect(point).not.toBeNull();
    expect(point!.x).toBeGreaterThan(0.2);
    expect(point!.x).toBeLessThan(0.5);
    expect(point!.y).toBeGreaterThan(0.3);
    expect(point!.y).toBeLessThan(0.6);
  });

  it("places Geneva west of Chur and Chiasso south of Basel", () => {
    const geneva = projectToSwissMap(46.2044, 6.1432)!;
    const chur = projectToSwissMap(46.8508, 9.5311)!;
    const basel = projectToSwissMap(47.5596, 7.5886)!;
    const chiasso = projectToSwissMap(45.832, 9.0305)!;
    expect(geneva.x).toBeLessThan(chur.x);
    expect(chiasso.y).toBeGreaterThan(basel.y);
  });

  it("rejects coordinates outside Switzerland", () => {
    expect(projectToSwissMap(48.8566, 2.3522)).toBeNull(); // Paris
    expect(projectToSwissMap(0, 0)).toBeNull();
  });

  it("keeps the country's proportions (wider than tall)", () => {
    expect(CH_MAP_ASPECT).toBeGreaterThan(1.3);
    expect(CH_MAP_ASPECT).toBeLessThan(1.8);
  });
});

describe("buildFarmMapPoints", () => {
  it("projects parseable in-bounds farms and skips the rest", () => {
    const points = buildFarmMapPoints([
      farm("a", "46.948, 7.4474"),
      farm("b", "not coordinates"),
      farm("c", "48.8566, 2.3522"), // Paris — bad geocode
    ]);
    expect(points).toHaveLength(1);
    expect(points[0].farmId).toBe("a");
    expect(points[0].x).toBeGreaterThan(0);
    expect(points[0].x).toBeLessThan(1);
  });
});
