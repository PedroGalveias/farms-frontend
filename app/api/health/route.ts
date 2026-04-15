import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEALTH_CHECK_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "farm-frontend",
      checkedAt: new Date().toISOString(),
      status: "ok",
    },
    {
      headers: HEALTH_CHECK_HEADERS,
    },
  );
}

export async function HEAD() {
  return new Response(null, {
    headers: HEALTH_CHECK_HEADERS,
    status: 200,
  });
}
