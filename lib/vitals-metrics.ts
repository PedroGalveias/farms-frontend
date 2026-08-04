import type { Histogram } from "@opentelemetry/api";
import type { RouteGroup } from "@/lib/route-group";

/** The Core Web Vitals this app reports. */
export const VITAL_METRICS = ["LCP", "CLS", "INP", "FCP", "TTFB"] as const;
export type VitalMetric = (typeof VITAL_METRICS)[number];

/** Coarse device class. Deliberately two values — see `deviceClassFrom`. */
export type DeviceClass = "mobile" | "desktop";

/**
 * Bucket boundaries per metric, in the metric's own unit.
 *
 * Chosen around the Core Web Vitals good / needs-improvement / poor thresholds
 * with extra resolution near them, because that is where a p75 has to land to
 * be actionable. A histogram can only resolve a percentile to the bucket it
 * falls in, so bounds are the accuracy budget: coarse buckets far from the
 * threshold cost nothing, coarse buckets across it lose the answer.
 *
 * Thresholds (good / poor): LCP 2500/4000ms · INP 200/500ms · CLS 0.1/0.25 ·
 * FCP 1800/3000ms · TTFB 800/1800ms.
 */
export const VITAL_BUCKETS: Record<VitalMetric, number[]> = {
  LCP: [500, 1000, 1500, 2000, 2500, 3000, 4000, 6000, 10000],
  INP: [50, 100, 150, 200, 300, 500, 750, 1000],
  CLS: [0.01, 0.05, 0.1, 0.15, 0.25, 0.4, 0.6, 1],
  FCP: [300, 600, 1000, 1400, 1800, 2400, 3000, 5000],
  TTFB: [100, 200, 400, 600, 800, 1200, 1800, 3000],
};

/** Metric name as it appears in the backend. */
export function instrumentNameFor(metric: VitalMetric): string {
  return `web_vitals.${metric.toLowerCase()}`;
}

/** CLS is a unitless score; the rest are milliseconds. */
export function unitFor(metric: VitalMetric): string {
  return metric === "CLS" ? "1" : "ms";
}

/**
 * Coarse device class from a request's headers.
 *
 * `Sec-CH-UA-Mobile` when the browser sends it, a narrow user-agent test
 * otherwise. Two values only, and nothing is stored: a p75 has to be split by
 * device because mobile and desktop INP differ by more than most fixes do, and
 * a blended figure says something is slow without saying for whom. Anything
 * finer would be a fingerprint, and this endpoint deliberately keeps no PII.
 */
export function deviceClassFrom(headers: Headers): DeviceClass {
  const hint = headers.get("sec-ch-ua-mobile");
  if (hint) {
    // The hint is a structured-header boolean: "?1" mobile, "?0" not.
    return hint.trim() === "?1" ? "mobile" : "desktop";
  }
  const ua = headers.get("user-agent") ?? "";
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua)
    ? "mobile"
    : "desktop";
}

/** Google's rating bands, recomputed rather than trusted from the payload. */
export function ratingFor(metric: VitalMetric, value: number): string {
  const [good, poor] = {
    LCP: [2500, 4000],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
  }[metric];
  if (value <= good) return "good";
  return value <= poor ? "needs-improvement" : "poor";
}

/**
 * The OTLP endpoint to export to, or null when metrics are switched off.
 *
 * Off is the default and a first-class state: with no endpoint configured this
 * module never loads an exporter, and `/api/vitals` behaves exactly as it did
 * before — log the beacon, return 204. Local development and CI stay silent
 * without opting out of anything.
 */
export function otlpEndpoint(): string | null {
  const configured =
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  return configured && configured.trim().length > 0 ? configured.trim() : null;
}

type Recorder = (
  metric: VitalMetric,
  value: number,
  attributes: { route: RouteGroup; device: DeviceClass; rating: string },
) => void;

/**
 * The recorder lives on `globalThis`, not in a module variable.
 *
 * Next bundles `instrumentation.ts` into its own chunk, separate from the route
 * handlers. A module imported by both is therefore *instantiated twice*, and a
 * module-level variable set during instrumentation is invisible to the copy the
 * route holds — the histograms would be created and never written to, and the
 * exporter would sit there with nothing to send. `globalThis` is the one scope
 * both chunks genuinely share.
 *
 * The symbol is registered globally (`Symbol.for`) for the same reason: a
 * plain `Symbol()` would itself be per-instance.
 */
const RECORDER_KEY = Symbol.for("farms.vitals.recorder");

type RecorderHolder = { [RECORDER_KEY]?: Recorder | null };

/**
 * Install the function `/api/vitals` records through.
 *
 * Called once from `instrumentation.ts`. Kept behind a setter so the route
 * handler has no import path to the OTel SDK: the SDK is Node-only and
 * initialising it is a side effect, and a route module is imported in contexts
 * (tests, type checking, the client graph) where neither is wanted.
 */
export function setVitalRecorder(next: Recorder | null): void {
  (globalThis as RecorderHolder)[RECORDER_KEY] = next;
}

function currentRecorder(): Recorder | null {
  return (globalThis as RecorderHolder)[RECORDER_KEY] ?? null;
}

/**
 * Record one beacon. A no-op when metrics are switched off.
 *
 * Never throws: a failure to observe a page is not a reason to fail the request
 * that reported it.
 */
export function recordVital(
  metric: VitalMetric,
  value: number,
  attributes: { route: RouteGroup; device: DeviceClass; rating: string },
): void {
  const recorder = currentRecorder();
  if (!recorder) {
    return;
  }
  try {
    recorder(metric, value, attributes);
  } catch {
    // Observability must never surface as a visitor-facing error.
  }
}

/** Shape the instrumentation hook builds; exported for its test. */
export type VitalHistograms = Record<VitalMetric, Histogram>;

/** Turn a set of histograms into the recorder the route calls. */
export function recorderFor(histograms: VitalHistograms): Recorder {
  return (metric, value, attributes) => {
    histograms[metric].record(value, attributes);
  };
}
