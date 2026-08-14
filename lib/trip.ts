// A "visit plan": an ordered, device-local list of farms the visitor wants to
// drive to, turned into a multi-stop route in Google Maps. Stored as small
// snapshots (not just ids) so the planner works without re-fetching the farm
// list. Mirrors the personalization storage helpers.

import { parseQuickSearchCoordinates } from "@/lib/coordinates";
import { readStorageJson, writeStorageJson } from "@/lib/safe-storage";

export const TRIP_STORAGE_KEY = "farms.trip";

/** Google Maps' free directions URL allows ~10 points; cap stops below that. */
export const MAX_TRIP_STOPS = 9;

export interface TripStop {
  id: string;
  name: string;
  coordinates: string;
  canton: string;
}

function isStop(value: unknown): value is TripStop {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stop = value as Partial<TripStop>;
  return (
    typeof stop.id === "string" &&
    typeof stop.name === "string" &&
    typeof stop.coordinates === "string" &&
    typeof stop.canton === "string"
  );
}

export function readTrip(): TripStop[] {
  const parsed = readStorageJson(TRIP_STORAGE_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isStop).slice(0, MAX_TRIP_STOPS);
}

export function writeTrip(stops: TripStop[]): void {
  writeStorageJson(TRIP_STORAGE_KEY, stops.slice(0, MAX_TRIP_STOPS));
}

/**
 * A Google Maps directions URL routing from the visitor's current location
 * through every stop (last = destination, the rest = waypoints, in order).
 * Universal — opens the Maps app on iOS/Android and the web app on desktop, so
 * it works across all engines. Returns null when no stop has usable
 * coordinates.
 */
export function tripDirectionsUrl(stops: TripStop[]): string | null {
  const points = stops
    .map((stop) => parseQuickSearchCoordinates(stop.coordinates))
    .filter((coords): coords is NonNullable<typeof coords> => coords != null)
    .map((coords) => `${coords.latitude},${coords.longitude}`);

  if (points.length === 0) {
    return null;
  }

  const destination = points[points.length - 1];
  const waypoints = points.slice(0, -1);

  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
