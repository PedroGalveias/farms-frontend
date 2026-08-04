import { NextResponse, connection } from "next/server";

const HEALTH_CHECK_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  // `checkedAt` is the current time, so this cannot be prerendered — a health
  // check that reports build time would be worse than useless. `connection()`
  // is how Cache Components spells "resolve this per request".
  await connection();

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
