import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredLocation,
  geolocationErrorKey,
  readStoredLocation,
  requestCurrentPosition,
  writeStoredLocation,
  LOCATION_STORAGE_KEY,
} from "@/lib/geolocation";

function setGeolocation(
  impl: (s: PositionCallback, e?: PositionErrorCallback) => void,
) {
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: vi.fn(impl) },
    configurable: true,
  });
}

afterEach(() => {
  delete (navigator as { geolocation?: unknown }).geolocation;
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
});

describe("requestCurrentPosition", () => {
  it("resolves with coordinates on success", async () => {
    setGeolocation((success) =>
      success({
        coords: { latitude: 46.95, longitude: 7.45, accuracy: 10 },
        timestamp: Date.now(),
      } as GeolocationPosition),
    );
    expect(await requestCurrentPosition()).toEqual({
      coords: { latitude: 46.95, longitude: 7.45 },
    });
  });

  it.each([
    [1, "PERMISSION_DENIED", "denied"],
    [3, "TIMEOUT", "timeout"],
    [2, "POSITION_UNAVAILABLE", "unavailable"],
  ])("maps error code %i to '%s' reason", async (code, constName, reason) => {
    setGeolocation((_success, error) =>
      error?.({
        code,
        [constName]: code,
      } as unknown as GeolocationPositionError),
    );
    expect(await requestCurrentPosition()).toEqual({ error: reason });
  });

  it("returns 'insecure' outside a secure context", async () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    setGeolocation(() => {
      throw new Error("should not be called");
    });
    expect(await requestCurrentPosition()).toEqual({ error: "insecure" });
  });

  it("returns 'unsupported' when geolocation is missing", async () => {
    delete (navigator as { geolocation?: unknown }).geolocation;
    expect(await requestCurrentPosition()).toEqual({ error: "unsupported" });
  });
});

describe("geolocationErrorKey", () => {
  it("maps a reason to its i18n key", () => {
    expect(geolocationErrorKey("denied")).toBe("geo_err_denied");
    expect(geolocationErrorKey("timeout")).toBe("geo_err_timeout");
  });
});

describe("remembered location", () => {
  afterEach(() => window.localStorage.clear());

  it("round-trips a written location", () => {
    writeStoredLocation({ latitude: 46.95, longitude: 7.45 });
    expect(readStoredLocation()).toEqual({ latitude: 46.95, longitude: 7.45 });
  });

  it("returns null when nothing is stored", () => {
    expect(readStoredLocation()).toBeNull();
  });

  it("returns null for corrupt or out-of-range data", () => {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, "{not json");
    expect(readStoredLocation()).toBeNull();
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({ latitude: 999, longitude: 7 }),
    );
    expect(readStoredLocation()).toBeNull();
  });

  it("clears a remembered location", () => {
    writeStoredLocation({ latitude: 46.95, longitude: 7.45 });
    clearStoredLocation();
    expect(readStoredLocation()).toBeNull();
  });
});
