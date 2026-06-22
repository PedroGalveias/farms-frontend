import { parseQuickSearchCoordinates } from "@/lib/quick-search";
import type { Farm } from "@/types/farm";

export interface FarmPoint {
  farm: Farm;
  latitude: number;
  longitude: number;
}

// Approximate bounding box of Switzerland — used to frame the map when there's
// nothing else to fit to.
export const SWITZERLAND_BOUNDS = {
  south: 45.8,
  west: 5.9,
  north: 47.9,
  east: 10.6,
};

/**
 * Farms that can be placed on the map: those whose coordinates parse to a valid
 * lat/lng. Farms with missing or malformed coordinates are dropped.
 */
export function toFarmPoints(farms: Farm[]): FarmPoint[] {
  const points: FarmPoint[] = [];
  for (const farm of farms) {
    const coords = parseQuickSearchCoordinates(farm.coordinates);
    if (coords) {
      points.push({
        farm,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  }
  return points;
}
