import { parseQuickSearchCoordinates } from "@/lib/coordinates";
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
 * Farms that can be placed on the Swiss map: those whose coordinates parse to
 * a valid lat/lng inside the country's generous framing bounds. Out-of-country
 * geocodes are dropped so one bad record cannot zoom the directory out to a
 * world map.
 */
export function toFarmPoints(farms: Farm[]): FarmPoint[] {
  const points: FarmPoint[] = [];
  for (const farm of farms) {
    const coords = parseQuickSearchCoordinates(farm.coordinates);
    if (
      coords &&
      coords.latitude >= SWITZERLAND_BOUNDS.south &&
      coords.latitude <= SWITZERLAND_BOUNDS.north &&
      coords.longitude >= SWITZERLAND_BOUNDS.west &&
      coords.longitude <= SWITZERLAND_BOUNDS.east
    ) {
      points.push({
        farm,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  }
  return points;
}
