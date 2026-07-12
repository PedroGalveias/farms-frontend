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
