import { afterEach, describe, expect, it, vi } from "vitest";
import {
  VITAL_BUCKETS,
  VITAL_METRICS,
  deviceClassFrom,
  instrumentNameFor,
  otlpEndpoint,
  ratingFor,
  recordVital,
  setVitalRecorder,
  unitFor,
} from "@/lib/vitals-metrics";

afterEach(() => {
  setVitalRecorder(null);
  vi.unstubAllEnvs();
});

describe("ratingFor", () => {
  it.each([
    ["LCP", 2500, "good"],
    ["LCP", 2501, "needs-improvement"],
    ["LCP", 4001, "poor"],
    ["INP", 200, "good"],
    ["INP", 501, "poor"],
    ["CLS", 0.1, "good"],
    ["CLS", 0.26, "poor"],
    ["TTFB", 800, "good"],
  ] as const)("rates %s %s as %s", (metric, value, expected) => {
    // Recomputed rather than trusted: the client's `rating` is
    // attacker-controllable and a wrong band would skew the series silently.
    expect(ratingFor(metric, value)).toBe(expected);
  });
});

describe("deviceClassFrom", () => {
  it("prefers the client hint over the user agent", () => {
    const headers = new Headers({
      "sec-ch-ua-mobile": "?1",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    });
    expect(deviceClassFrom(headers)).toBe("mobile");
  });

  it("reads ?0 as desktop", () => {
    expect(deviceClassFrom(new Headers({ "sec-ch-ua-mobile": "?0" }))).toBe(
      "desktop",
    );
  });

  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "mobile"],
    ["Mozilla/5.0 (Linux; Android 14)", "mobile"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "desktop"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "desktop"],
  ])("falls back to the user agent: %s", (ua, expected) => {
    expect(deviceClassFrom(new Headers({ "user-agent": ua }))).toBe(expected);
  });

  it("defaults to desktop when nothing identifies the client", () => {
    expect(deviceClassFrom(new Headers())).toBe("desktop");
  });
});

describe("otlpEndpoint", () => {
  it("is null when nothing is configured", () => {
    vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "");
    vi.stubEnv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "");
    // Off is the default, and a first-class state — local dev and CI stay
    // silent without opting out of anything.
    expect(otlpEndpoint()).toBeNull();
  });

  it("prefers the metrics-specific endpoint", () => {
    vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://general:4318");
    vi.stubEnv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "http://metrics:4318");
    expect(otlpEndpoint()).toBe("http://metrics:4318");
  });
});

describe("recordVital", () => {
  it("does nothing when no recorder is installed", () => {
    // The common case in dev and CI. It must not throw.
    expect(() =>
      recordVital("LCP", 1200, {
        route: "/",
        device: "mobile",
        rating: "good",
      }),
    ).not.toThrow();
  });

  it("forwards the value and attributes to the recorder", () => {
    const recorder = vi.fn();
    setVitalRecorder(recorder);

    recordVital("INP", 180, {
      route: "/canton/[code]",
      device: "mobile",
      rating: "good",
    });

    expect(recorder).toHaveBeenCalledWith("INP", 180, {
      route: "/canton/[code]",
      device: "mobile",
      rating: "good",
    });
  });

  it("swallows a failing recorder", () => {
    setVitalRecorder(() => {
      throw new Error("exporter is down");
    });
    // Failing to observe a page is not a reason to fail the request that
    // reported it.
    expect(() =>
      recordVital("CLS", 0.05, {
        route: "/",
        device: "desktop",
        rating: "good",
      }),
    ).not.toThrow();
  });
});

describe("instrument definitions", () => {
  it("names and units every metric", () => {
    for (const metric of VITAL_METRICS) {
      expect(instrumentNameFor(metric)).toBe(
        `web_vitals.${metric.toLowerCase()}`,
      );
    }
    // CLS is a unitless score; everything else is milliseconds.
    expect(unitFor("CLS")).toBe("1");
    expect(unitFor("LCP")).toBe("ms");
  });

  it("gives every metric ascending buckets that straddle its thresholds", () => {
    for (const metric of VITAL_METRICS) {
      const bounds = VITAL_BUCKETS[metric];
      expect(bounds.length).toBeGreaterThan(3);
      // Out-of-order bounds are accepted silently by some backends and produce
      // a nonsense histogram, so assert it here.
      expect([...bounds].sort((a, b) => a - b)).toEqual(bounds);
    }
    // The band a p75 has to resolve is the good/poor threshold, so a bound has
    // to sit on it.
    expect(VITAL_BUCKETS.LCP).toContain(2500);
    expect(VITAL_BUCKETS.INP).toContain(200);
    expect(VITAL_BUCKETS.CLS).toContain(0.1);
  });
});

describe("recorder sharing across bundles", () => {
  it("keeps the recorder on globalThis, not in module scope", () => {
    const recorder = vi.fn();
    setVitalRecorder(recorder);

    // Next bundles instrumentation.ts separately from the route handlers, so a
    // module imported by both is instantiated twice and a module-level variable
    // set by one is invisible to the other. That failure is silent: histograms
    // get created and never written to, and the exporter ships nothing. Asserting
    // the global key is what stops it coming back.
    const key = Symbol.for("farms.vitals.recorder");
    expect((globalThis as Record<symbol, unknown>)[key]).toBe(recorder);

    setVitalRecorder(null);
    expect((globalThis as Record<symbol, unknown>)[key]).toBeNull();
  });
});
