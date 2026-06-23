import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface VitalPayload {
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  path?: unknown;
}

const ALLOWED_METRICS = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

/**
 * Receives Web Vitals beacons from the client and logs them server-side so they
 * surface in the platform logs (Render) — lightweight observability with no
 * third-party analytics and no PII (only the metric and the pathname).
 */
export async function POST(request: Request) {
  let body: VitalPayload;
  try {
    body = (await request.json()) as VitalPayload;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  if (ALLOWED_METRICS.has(name) && typeof body.value === "number") {
    const rating = typeof body.rating === "string" ? body.rating : "";
    const path = typeof body.path === "string" ? body.path : "";
    console.info(
      `[web-vitals] ${name}=${Math.round(body.value)} ${rating} ${path}`.trim(),
    );
  }

  // Beacons don't read the response; keep it empty and cheap.
  return new NextResponse(null, { status: 204 });
}
