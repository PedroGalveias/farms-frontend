/**
 * One place for browser geolocation, hardened for mobile Safari.
 *
 * Why this exists: on iOS Safari `getCurrentPosition` is far more fragile than
 * on desktop. Two things bite us:
 *   1. It must be called synchronously from a user gesture (a tap). The Promise
 *      executor below runs synchronously, so calling `requestCurrentPosition()`
 *      directly inside an onClick keeps the gesture intact.
 *   2. `enableHighAccuracy: true` with a short timeout frequently fails on
 *      iPhone — a high-accuracy GPS fix can take far longer than 10s (often
 *      longer than the user takes to answer the permission prompt), so the
 *      request times out and looks like "nothing happened". City-level accuracy
 *      is plenty for distance sorting, resolves fast, and is reliable.
 *
 * It also reports *why* a request failed so the UI can show something
 * actionable ("permission blocked", "timed out", …) instead of a silent dead
 * end.
 */
export type GeolocationErrorReason =
  | "denied"
  | "unavailable"
  | "timeout"
  | "insecure"
  | "unsupported";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export type GeolocationOutcome =
  | { coords: GeolocationCoords; error?: undefined }
  | { coords?: undefined; error: GeolocationErrorReason };

// City-level accuracy, a generous timeout (room for the prompt + a fix), and a
// 5-minute cache. See the file header for why high accuracy is intentionally
// off.
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 20_000,
};

function reasonFromError(
  error: GeolocationPositionError,
): GeolocationErrorReason {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unavailable";
  }
}

/**
 * Request the user's current position. Resolves with coordinates or a reason.
 * Call this directly from a user-gesture handler (don't `await` anything first)
 * so iOS Safari shows the permission prompt.
 */
export function requestCurrentPosition(): Promise<GeolocationOutcome> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return Promise.resolve({ error: "unsupported" });
  }
  // Geolocation only works in a secure context (https or localhost); iOS Safari
  // silently refuses to prompt over plain http.
  if (window.isSecureContext === false) {
    return Promise.resolve({ error: "insecure" });
  }
  if (!("geolocation" in navigator)) {
    return Promise.resolve({ error: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }),
      (error) => resolve({ error: reasonFromError(error) }),
      GEO_OPTIONS,
    );
  });
}

/** i18n key for a geolocation failure reason. */
export function geolocationErrorKey(reason: GeolocationErrorReason): string {
  return `geo_err_${reason}`;
}
