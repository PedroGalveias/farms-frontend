import {
  FarmsApiError,
  getFarmsApiBaseUrl,
  readErrorMessage,
} from "@/lib/backend";
import type { AuthUser } from "@/lib/auth";

const AUTH_TIMEOUT_MS = 8000;

/**
 * Ask the backend who the current session belongs to, given a Cookie header.
 * Returns null for an unauthenticated/expired session (401); throws for other
 * backend failures. Network-only — kept separate from getCurrentUser so it's
 * unit-testable without the Next request context.
 */
export async function fetchCurrentUser(
  cookieHeader: string,
): Promise<AuthUser | null> {
  let response: Response;
  try {
    response = await fetch(`${getFarmsApiBaseUrl()}/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
  } catch {
    // Treat an unreachable/slow backend as "not logged in" rather than crashing
    // the page that's only asking to render the right nav.
    return null;
  }

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new FarmsApiError(await readErrorMessage(response), response.status);
  }
  return (await response.json()) as AuthUser;
}

/**
 * Server-side current user, read from the incoming request cookies. Use from
 * Server Components / route guards. `next/headers` is imported lazily so this
 * module stays importable in plain unit tests.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();
  return fetchCurrentUser(cookieHeader);
}
