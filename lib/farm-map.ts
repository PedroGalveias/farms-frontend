import { parseQuickSearchCoordinates } from "@/lib/coordinates";
import type { Farm } from "@/types/farm";

// Switzerland's bounding box (generous, covers Basel to Chiasso and Geneva to
// the Grisons). Fixed rather than data-derived so a single mis-geocoded farm
// can't squash the whole map.
const LAT_MIN = 45.75;
const LAT_MAX = 47.9;
const LNG_MIN = 5.85;
const LNG_MAX = 10.6;

// Longitude degrees shrink with latitude; at Switzerland's ~46.8° a degree of
// longitude is ~cos(46.8°) the length of a degree of latitude. Scaling x by
// this keeps the country's true proportions instead of stretching it wide.
const LNG_SCALE = Math.cos((46.8 * Math.PI) / 180);

/** The plotted map's width:height ratio after the latitude correction. */
export const CH_MAP_ASPECT =
  ((LNG_MAX - LNG_MIN) * LNG_SCALE) / (LAT_MAX - LAT_MIN);

/** Fractional margins around the drawable map region, per side. */
export interface MapInset {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/** Where the country actually sits inside a container, in pixels. */
export interface MapFit {
  mapH: number;
  mapW: number;
  offX: number;
  offY: number;
}

/**
 * Letterbox the country inside a container, preserving [`CH_MAP_ASPECT`].
 *
 * Scaling x and y independently to the container is the tempting one-liner and
 * it is wrong: it stretches Switzerland to whatever shape the box happens to
 * be. On a tall narrow panel — an iPad in landscape, where the map column is
 * roughly 0.5:1 against the country's 1.6:1 — that renders as a vertical smear
 * with no recognisable border.
 *
 * Shared by both dot-map renderers on purpose. This exact bug happened once
 * because each had its own copy of the arithmetic and only one was corrected.
 */
export function fitSwissMap(
  width: number,
  height: number,
  inset: MapInset,
): MapFit {
  const availX = width * inset.left;
  const availY = height * inset.top;
  const availW = width * (1 - inset.left - inset.right);
  const availH = height * (1 - inset.top - inset.bottom);

  let mapW = availW;
  let mapH = mapW / CH_MAP_ASPECT;
  if (mapH > availH) {
    mapH = availH;
    mapW = mapH * CH_MAP_ASPECT;
  }

  // Centred inside the inset box, so an asymmetric inset (the quick-search
  // panel biases the map upward to leave the headline a floor) still places
  // the country sensibly rather than pinning it to a corner.
  return {
    mapH,
    mapW,
    offX: availX + (availW - mapW) / 2,
    offY: availY + (availH - mapH) / 2,
  };
}

export interface FarmMapPoint {
  farmId: string;
  /** 0..1 across the map, west → east. */
  x: number;
  /** 0..1 down the map, north → south. */
  y: number;
}

/**
 * Project WGS84 coordinates into the unit square of the Switzerland map.
 * Returns null outside the bounding box (bad geocode) — callers just skip it.
 */
export function projectToSwissMap(
  latitude: number,
  longitude: number,
): { x: number; y: number } | null {
  // NaN fails every comparison, so a bounds check alone lets it through and
  // returns {x: NaN, y: NaN} — a "projected" point that silently paints
  // nothing on the canvas and breaks the documented null contract.
  // Number.isFinite rejects NaN and both infinities here, so the bounds check
  // below only ever sees real numbers.
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (
    latitude < LAT_MIN ||
    latitude > LAT_MAX ||
    longitude < LNG_MIN ||
    longitude > LNG_MAX
  ) {
    return null;
  }
  return {
    x: (longitude - LNG_MIN) / (LNG_MAX - LNG_MIN),
    y: 1 - (latitude - LAT_MIN) / (LAT_MAX - LAT_MIN),
  };
}

/** Every farm with parseable in-bounds coordinates, projected once. */
export function buildFarmMapPoints(farms: Farm[]): FarmMapPoint[] {
  const points: FarmMapPoint[] = [];
  for (const farm of farms) {
    const coords = parseQuickSearchCoordinates(farm.coordinates);
    if (!coords) {
      continue;
    }
    const projected = projectToSwissMap(coords.latitude, coords.longitude);
    if (!projected) {
      continue;
    }
    points.push({ farmId: farm.id, x: projected.x, y: projected.y });
  }
  return points;
}
