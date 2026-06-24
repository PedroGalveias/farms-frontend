import { NextResponse, type NextRequest } from "next/server";
import { getFarmsApiBaseUrl } from "@/lib/backend";
import { SESSION_COOKIE_NAME, isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;

// Forward the session cookie so the backend can invalidate it, relay the
// backend's cookie purge, and defensively clear our own copy regardless.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let status = 200;
  let setCookies: string[] = [];
  try {
    const backendRes = await fetch(`${getFarmsApiBaseUrl()}/logout`, {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    status = backendRes.status;
    setCookies = backendRes.headers.getSetCookie();
  } catch {
    // Even if the backend is unreachable, still clear the local session below.
  }

  const res = new NextResponse(null, { status: status === 0 ? 200 : status });
  for (const cookie of setCookies) {
    res.headers.append("set-cookie", cookie);
  }
  res.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
