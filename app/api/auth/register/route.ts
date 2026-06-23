import { NextResponse, type NextRequest } from "next/server";
import { getFarmsApiBaseUrl } from "@/lib/backend";
import { isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;

// Pure passthrough: relay {email, password} to the backend and return its status
// verbatim (202 always on success — the page shows the same "check your email"
// panel regardless, to avoid account enumeration).
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getFarmsApiBaseUrl()}/register`, {
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

  return new NextResponse(await backendRes.text(), {
    status: backendRes.status,
    headers: {
      "Content-Type":
        backendRes.headers.get("content-type") ?? "application/json",
    },
  });
}
