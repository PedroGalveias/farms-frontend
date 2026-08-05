import { NextResponse, after } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { routeGroupFor } from "@/lib/route-group";
import {
  VITAL_METRICS,
  deviceClassFrom,
  flushVitals,
  ratingFor,
  recordVital,
  type VitalMetric,
} from "@/lib/vitals-metrics";

interface VitalPayload {
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  path?: unknown;
}

const ALLOWED_METRICS = new Set<string>(VITAL_METRICS);

// No sanitiser here any more, and that is stronger than the one it replaces.
// Every field in the log line below now comes from a CLOSED set — the metric
// name is checked against ALLOWED_METRICS, the rating and route group are
// computed here and can only be one of their own constants, and the device
// class is one of two words. Nothing attacker-controlled reaches the log, so
// there is no CR/LF to strip (CWE-117) and no length to cap.
//
// If a raw field from the payload is ever logged again — `path`, say — it needs
// its own escaping; do not assume this line is safe by default.

/**
 * Receives Web Vitals beacons from the client.
 *
 * Each accepted beacon is logged (as before) and recorded into an OTLP
 * histogram, so a p75 exists for every metric instead of every sample being
 * logged and discarded. When no OTLP endpoint is configured the recording is a
 * no-op and this behaves exactly as it always has.
 *
 * Two dimensions are attached, and both are resolved HERE rather than trusted
 * from the payload:
 *
 *  - **route group** — the route TEMPLATE, not the pathname. `/canton/be` and
 *    25 siblings are one page with one performance profile; recorded apart they
 *    are 26 series each holding a twenty-sixth of the traffic, and a p75 needs
 *    samples to mean anything.
 *  - **device class** — mobile or desktop. Their INP differs by more than most
 *    fixes do, so a blended p75 says something is slow without saying for whom.
 *
 * Still no PII: a metric name, a number, a route template and a coarse device
 * class. No URL query strings, no user-agent string, no address.
 */
export async function POST(request: Request) {
  // Metrics are anonymous, but accepting arbitrary cross-origin POSTs would
  // turn this endpoint into an easy log-amplification target.
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  let body: VitalPayload;
  try {
    body = (await request.json()) as VitalPayload;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  if (
    ALLOWED_METRICS.has(name) &&
    typeof body.value === "number" &&
    Number.isFinite(body.value)
  ) {
    const metric = name as VitalMetric;
    const path = typeof body.path === "string" ? body.path : "";
    // Recomputed rather than taken from the payload: the client's rating is
    // attacker-controllable, and a wrong band would quietly skew the series.
    const rating = ratingFor(metric, body.value);
    const route = routeGroupFor(path);
    const device = deviceClassFrom(request.headers);

    recordVital(metric, body.value, { route, device, rating });

    console.info(
      `[web-vitals] ${name}=${Math.round(body.value)} ${rating} ${route} ${device}`,
    );

    // Export AFTER the response, not before it — a beacon must not wait on the
    // collector. `flushVitals` throttles, so a page view sending five beacons
    // still costs at most one export.
    //
    // Without this, nothing is exported at all on a serverless host: the
    // reader's 60s timer never fires in a frozen sandbox and there is no
    // SIGTERM to flush on. The endpoint would keep answering 204 and Grafana
    // would keep showing nothing.
    after(async () => {
      await flushVitals();
    });
  }

  // Beacons don't read the response; keep it empty and cheap.
  return new NextResponse(null, { status: 204 });
}
