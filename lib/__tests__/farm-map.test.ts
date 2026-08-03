import { describe, expect, it } from "vitest";
import {
  buildFarmMapPoints,
  CH_MAP_ASPECT,
  fitSwissMap,
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

describe("projectToSwissMap — non-finite input", () => {
  // NaN fails every comparison, so a bounds check alone let it through and
  // returned {x: NaN, y: NaN}: a "point" that paints nothing and breaks the
  // documented null contract.
  it("returns null for NaN and Infinity", () => {
    expect(projectToSwissMap(NaN, NaN)).toBeNull();
    expect(projectToSwissMap(46.9, NaN)).toBeNull();
    expect(projectToSwissMap(NaN, 7.4)).toBeNull();
    expect(projectToSwissMap(Infinity, 7.4)).toBeNull();
    expect(projectToSwissMap(46.9, -Infinity)).toBeNull();
  });

  it("still projects a valid Swiss coordinate", () => {
    const point = projectToSwissMap(46.95, 7.45);
    expect(point).not.toBeNull();
    expect(Number.isFinite(point!.x)).toBe(true);
    expect(Number.isFinite(point!.y)).toBe(true);
  });
});

describe("fitSwissMap", () => {
  const NONE = { bottom: 0, left: 0, right: 0, top: 0 };

  it("keeps the country's aspect ratio in a portrait container", () => {
    // The iPad-landscape case: the quick-search map column is far taller than
    // it is wide. Scaling x and y independently squashed Switzerland into an
    // unrecognisable vertical smear; the fit must letterbox instead.
    const fit = fitSwissMap(300, 600, NONE);
    expect(fit.mapW / fit.mapH).toBeCloseTo(CH_MAP_ASPECT, 5);
    expect(fit.mapW).toBeLessThanOrEqual(300);
    expect(fit.mapH).toBeLessThanOrEqual(600);
  });

  it("keeps the aspect ratio in a landscape container too", () => {
    const fit = fitSwissMap(1200, 300, NONE);
    expect(fit.mapW / fit.mapH).toBeCloseTo(CH_MAP_ASPECT, 5);
    expect(fit.mapH).toBeLessThanOrEqual(300);
  });

  it("centres the map inside the available box", () => {
    const fit = fitSwissMap(300, 600, NONE);
    // Width is the binding constraint here, so it fills across and centres down.
    expect(fit.offX).toBeCloseTo(0, 5);
    expect(fit.offY).toBeCloseTo((600 - fit.mapH) / 2, 5);
  });

  it("respects an asymmetric inset", () => {
    // The quick-search panel biases the map upward so the headline keeps a
    // floor; the country must still sit inside that box rather than the panel.
    const inset = { bottom: 0.3, left: 0.08, right: 0.06, top: 0.16 };
    const fit = fitSwissMap(1000, 800, inset);
    expect(fit.offX).toBeGreaterThanOrEqual(1000 * inset.left);
    expect(fit.offY).toBeGreaterThanOrEqual(800 * inset.top);
    expect(fit.offX + fit.mapW).toBeLessThanOrEqual(
      1000 * (1 - inset.right) + 1e-6,
    );
    expect(fit.offY + fit.mapH).toBeLessThanOrEqual(
      800 * (1 - inset.bottom) + 1e-6,
    );
    expect(fit.mapW / fit.mapH).toBeCloseTo(CH_MAP_ASPECT, 5);
  });

  it("degenerates safely on a zero-sized container", () => {
    // ResizeObserver reports 0x0 before first layout; the map must not emit
    // NaN offsets that would silently paint nothing.
    const fit = fitSwissMap(0, 0, NONE);
    expect(Number.isFinite(fit.mapW)).toBe(true);
    expect(Number.isFinite(fit.offX)).toBe(true);
    expect(fit.mapW).toBe(0);
  });
});
