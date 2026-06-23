import { NextResponse, type NextRequest } from "next/server";
import { getFarmsApiBaseUrl } from "@/lib/backend";
import { isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;

// Relay credentials to the backend; on success copy the backend's httpOnly
// session cookie onto our (same-origin) response so the browser stores it for
// this origin. The cookie value is never exposed to client JS.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getFarmsApiBaseUrl()}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "The service is unavailable. Please try again." },
      { status: 503 },
    );
  }

  const res = new NextResponse(await backendRes.text(), {
    status: backendRes.status,
    headers: {
      "Content-Type":
        backendRes.headers.get("content-type") ?? "application/json",
    },
  });

  for (const cookie of backendRes.headers.getSetCookie()) {
    res.headers.append("set-cookie", cookie);
  }

  return res;
}
