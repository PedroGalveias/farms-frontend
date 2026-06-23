import { NextResponse, type NextRequest } from "next/server";
import { fetchCurrentUser } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

// Lets the client AuthProvider re-check the session after login/logout. Returns
// { user } (null when unauthenticated) — never leaks the session cookie value.
export async function GET(req: NextRequest) {
  try {
    const user = await fetchCurrentUser(req.headers.get("cookie") ?? "");
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { user: null },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
