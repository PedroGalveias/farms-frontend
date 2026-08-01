import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface VitalPayload {
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  path?: unknown;
}

const ALLOWED_METRICS = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

// Strip CR/LF so attacker-controlled fields can't forge log lines (CWE-117),
// and cap the length so they can't flood the logs with one huge beacon.
function sanitizeForLog(value: string): string {
  return value.replace(/[\r\n]/g, "").slice(0, 200);
}

/**
 * Receives Web Vitals beacons from the client and logs them server-side so they
 * surface in the platform logs (Render) — lightweight observability with no
 * third-party analytics and no PII (only the metric and the pathname).
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
    const rating =
      typeof body.rating === "string" ? sanitizeForLog(body.rating) : "";
    const path = typeof body.path === "string" ? sanitizeForLog(body.path) : "";
    console.info(
      `[web-vitals] ${name}=${Math.round(body.value)} ${rating} ${path}`.trim(),
    );
  }

  // Beacons don't read the response; keep it empty and cheap.
  return new NextResponse(null, { status: 204 });
}
