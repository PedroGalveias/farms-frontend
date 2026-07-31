import { describe, expect, it } from "vitest";
import {
  DEFAULT_COORDS,
  isDaylight,
  nextSunFlip,
  sunTimes,
} from "@/lib/suncycle";

const BERN = DEFAULT_COORDS;

describe("suncycle", () => {
  it("computes a plausible summer day in Bern", () => {
    // June 21st — Bern sunrise ~05:33, sunset ~21:26 local (UTC+2).
    const noonUtc = new Date("2026-06-21T12:00:00Z");
    const times = sunTimes(noonUtc, BERN.latitude, BERN.longitude);
    expect(times).not.toBeNull();
    const { sunrise, sunset } = times!;
    expect(sunrise.getTime()).toBeLessThan(sunset.getTime());
    // Sunrise between 03:00 and 04:00 UTC; sunset between 19:00 and 20:00 UTC.
    expect(sunrise.getUTCHours()).toBeGreaterThanOrEqual(3);
    expect(sunrise.getUTCHours()).toBeLessThanOrEqual(4);
    expect(sunset.getUTCHours()).toBeGreaterThanOrEqual(19);
    expect(sunset.getUTCHours()).toBeLessThanOrEqual(20);
    // Day length ~15.9h in midsummer.
    const hours = (sunset.getTime() - sunrise.getTime()) / 3_600_000;
    expect(hours).toBeGreaterThan(15);
    expect(hours).toBeLessThan(16.5);
  });

  it("computes a plausible winter day in Bern", () => {
    const noonUtc = new Date("2026-12-21T12:00:00Z");
    const times = sunTimes(noonUtc, BERN.latitude, BERN.longitude);
    expect(times).not.toBeNull();
    const hours =
      (times!.sunset.getTime() - times!.sunrise.getTime()) / 3_600_000;
    // ~8.5h of daylight at the winter solstice.
    expect(hours).toBeGreaterThan(8);
    expect(hours).toBeLessThan(9);
  });

  it("says daylight at midday and darkness at midnight", () => {
    expect(
      isDaylight(
        new Date("2026-06-21T12:00:00Z"),
        BERN.latitude,
        BERN.longitude,
      ),
    ).toBe(true);
    expect(
      isDaylight(
        new Date("2026-06-21T23:30:00Z"),
        BERN.latitude,
        BERN.longitude,
      ),
    ).toBe(false);
  });

  it("nextSunFlip is always in the future and within ~24h", () => {
    for (const iso of [
      "2026-06-21T02:00:00Z", // before sunrise
      "2026-06-21T12:00:00Z", // midday
      "2026-06-21T22:00:00Z", // after sunset
    ]) {
      const now = new Date(iso);
      const flip = nextSunFlip(now, BERN.latitude, BERN.longitude);
      expect(flip.getTime()).toBeGreaterThan(now.getTime());
      expect(flip.getTime() - now.getTime()).toBeLessThan(24 * 3_600_000);
    }
  });
});

// Switzerland never goes polar, but the coordinates come from the visitor's
// device — a Swiss farm directory read from a research station or a flight is
// far-fetched yet costs nothing to be correct about, and these are the only
// paths where the functions degrade rather than compute. They are documented
// fallbacks, so the tests exist to keep them that way: a future refactor that
// makes sunTimes throw or isDaylight return undefined at 78°N would break the
// theme switcher silently for anyone it did reach.
describe("suncycle above the Arctic Circle", () => {
  // Longyearbyen, Svalbard.
  const SVALBARD = { latitude: 78.22, longitude: 15.65 };

  it("returns null in polar day and polar night", () => {
    // Midsummer: the sun never sets, so the sunrise equation has no solution.
    expect(
      sunTimes(
        new Date("2026-06-21T12:00:00Z"),
        SVALBARD.latitude,
        SVALBARD.longitude,
      ),
    ).toBeNull();
    // Midwinter: the sun never rises.
    expect(
      sunTimes(
        new Date("2026-12-21T12:00:00Z"),
        SVALBARD.latitude,
        SVALBARD.longitude,
      ),
    ).toBeNull();
  });

  it("isDaylight falls back to a fixed 07:00-19:00 local window", () => {
    // The fallback reads LOCAL hours, so these are built with the local-time
    // constructor — asserting on a UTC instant would flip with the runner's
    // timezone. Any December date at this latitude is polar night, so the
    // UTC/local date boundary can't change which branch runs.
    const atLocalHour = (hour: number) => new Date(2026, 11, 21, hour, 0, 0);

    expect(
      isDaylight(atLocalHour(12), SVALBARD.latitude, SVALBARD.longitude),
    ).toBe(true);
    expect(
      isDaylight(atLocalHour(3), SVALBARD.latitude, SVALBARD.longitude),
    ).toBe(false);
    // Both ends of the window, which is where an off-by-one would hide.
    expect(
      isDaylight(atLocalHour(7), SVALBARD.latitude, SVALBARD.longitude),
    ).toBe(true);
    expect(
      isDaylight(atLocalHour(19), SVALBARD.latitude, SVALBARD.longitude),
    ).toBe(false);
  });

  it("nextSunFlip re-checks in six hours when neither day resolves", () => {
    // Deep polar night: today and tomorrow both return null, so there is no
    // real flip to schedule and the caller must still be given a future time —
    // returning `now` or a past date would spin the re-check timer.
    const now = new Date("2026-12-21T12:00:00Z");
    const flip = nextSunFlip(now, SVALBARD.latitude, SVALBARD.longitude);
    expect(flip.getTime() - now.getTime()).toBe(6 * 3_600_000);
  });
});
