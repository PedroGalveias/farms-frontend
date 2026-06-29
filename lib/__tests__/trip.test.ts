import { afterEach, describe, expect, it } from "vitest";
import {
  MAX_TRIP_STOPS,
  readTrip,
  tripDirectionsUrl,
  writeTrip,
  type TripStop,
} from "@/lib/trip";

function stop(overrides: Partial<TripStop> & Pick<TripStop, "id">): TripStop {
  return {
    name: `Farm ${overrides.id}`,
    coordinates: "46.95,7.45",
    canton: "BE",
    ...overrides,
  };
}

afterEach(() => {
  window.localStorage.clear();
});

describe("trip storage", () => {
  it("round-trips stops through localStorage", () => {
    const stops = [stop({ id: "a" }), stop({ id: "b" })];
    writeTrip(stops);
    expect(readTrip().map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("ignores malformed / non-array data", () => {
    window.localStorage.setItem("farms.trip", "not json");
    expect(readTrip()).toEqual([]);
    window.localStorage.setItem("farms.trip", JSON.stringify([{ id: 1 }]));
    expect(readTrip()).toEqual([]);
  });

  it("caps stored stops at the maximum", () => {
    const many = Array.from({ length: MAX_TRIP_STOPS + 4 }, (_, i) =>
      stop({ id: `s${i}` }),
    );
    writeTrip(many);
    expect(readTrip()).toHaveLength(MAX_TRIP_STOPS);
  });
});

describe("tripDirectionsUrl", () => {
  it("returns null when no stop has usable coordinates", () => {
    expect(tripDirectionsUrl([])).toBeNull();
    expect(
      tripDirectionsUrl([stop({ id: "x", coordinates: "nope" })]),
    ).toBeNull();
  });

  it("uses a single stop as the destination, no waypoints", () => {
    const url = tripDirectionsUrl([
      stop({ id: "a", coordinates: "46.95,7.45" }),
    ]);
    expect(url).toContain("destination=46.95%2C7.45");
    expect(url).not.toContain("waypoints");
    expect(url).toContain("travelmode=driving");
  });

  it("routes through waypoints with the last stop as destination", () => {
    const url = tripDirectionsUrl([
      stop({ id: "a", coordinates: "46.0,7.0" }),
      stop({ id: "b", coordinates: "46.5,7.5" }),
      stop({ id: "c", coordinates: "47.0,8.0" }),
    ]);
    expect(url).toContain("destination=47%2C8");
    // a and b become ordered waypoints (| encodes to %7C).
    expect(url).toContain("waypoints=46%2C7%7C46.5%2C7.5");
  });

  it("skips stops with unparseable coordinates", () => {
    const url = tripDirectionsUrl([
      stop({ id: "a", coordinates: "46.0,7.0" }),
      stop({ id: "bad", coordinates: "x" }),
      stop({ id: "c", coordinates: "47.0,8.0" }),
    ]);
    expect(url).toContain("destination=47%2C8");
    expect(url).toContain("waypoints=46%2C7");
  });
});
