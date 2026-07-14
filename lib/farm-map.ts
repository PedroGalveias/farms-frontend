import { parseQuickSearchCoordinates } from "@/lib/quick-search";
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
