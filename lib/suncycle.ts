// Sunrise/sunset for the "sun cycle" theme mode — light while the sun is up,
// dark after it sets. Uses the standard sunrise equation (NOAA-style, ±a few
// minutes — plenty for a theme switch). No dependencies.

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

// Without a shared location we assume the middle of Switzerland (Bern): a
// Swiss directory's audience is at most ~1° of longitude away, which moves
// sunrise by minutes. If the visitor shared a location for distance sorting,
// callers pass that instead.
export const DEFAULT_COORDS = { latitude: 46.948, longitude: 7.447 };

const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;
const J2000 = 2451545;
// Julian date of the Unix epoch.
const J_EPOCH = 2440587.5;

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS + J_EPOCH;
}

function fromJulian(j: number): Date {
  return new Date((j - J_EPOCH) * DAY_MS);
}

/**
 * Sunrise and sunset (as absolute Dates) for the civil day containing `date`
 * at the given coordinates. Returns null in polar day/night (impossible in
 * Switzerland, but the maths allows it).
 */
export function sunTimes(
  date: Date,
  latitude: number,
  longitude: number,
): SunTimes | null {
  // Anchor at the day's UTC midnight: the ceil below selects "the next solar
  // transit", so feeding the current instant would roll an afternoon query
  // over to tomorrow's sunrise/sunset.
  const dayStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const n = Math.ceil(toJulian(dayStart) - (J2000 + 0.0009) + longitude / 360);
  const jStar = n + 0.0009 - longitude / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C =
    1.9148 * Math.sin(M * DEG) +
    0.02 * Math.sin(2 * M * DEG) +
    0.0003 * Math.sin(3 * M * DEG);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit =
    J2000 +
    jStar +
    0.0053 * Math.sin(M * DEG) -
    0.0069 * Math.sin(2 * lambda * DEG);
  const delta = Math.asin(Math.sin(lambda * DEG) * Math.sin(23.44 * DEG));
  // -0.83° accounts for refraction + the solar disc's radius.
  const cosOmega =
    (Math.sin(-0.83 * DEG) - Math.sin(latitude * DEG) * Math.sin(delta)) /
    (Math.cos(latitude * DEG) * Math.cos(delta));
  if (cosOmega < -1 || cosOmega > 1) {
    return null; // polar day (< -1) or polar night (> 1)
  }
  const omega = Math.acos(cosOmega) / DEG;
  return {
    sunrise: fromJulian(jTransit - omega / 360),
    sunset: fromJulian(jTransit + omega / 360),
  };
}

/** Whether the sun is up at `now` for the given coordinates. */
export function isDaylight(
  now: Date,
  latitude: number,
  longitude: number,
): boolean {
  const times = sunTimes(now, latitude, longitude);
  if (!times) {
    // Polar edge: fall back to a fixed 07:00–19:00 window.
    const hour = now.getHours();
    return hour >= 7 && hour < 19;
  }
  return now >= times.sunrise && now < times.sunset;
}

/**
 * The next moment the daylight state flips (the next sunrise or sunset after
 * `now`) — used to schedule the theme re-check.
 */
export function nextSunFlip(
  now: Date,
  latitude: number,
  longitude: number,
): Date {
  const today = sunTimes(now, latitude, longitude);
  if (today) {
    if (now < today.sunrise) return today.sunrise;
    if (now < today.sunset) return today.sunset;
  }
  const tomorrow = sunTimes(
    new Date(now.getTime() + DAY_MS),
    latitude,
    longitude,
  );
  if (tomorrow) return tomorrow.sunrise;
  // Polar fallback: check again in six hours.
  return new Date(now.getTime() + 6 * 3_600_000);
}
