// Pure, framework-free auth helpers shared by the route handlers, the service
// layer, and the UI. No network, no next/* imports — safe to unit-test.

export type Role = "user" | "admin";

export interface AuthUser {
  user_id: string;
  role: Role;
  /** Optional — present when the backend /me response includes it. */
  username?: string;
}

/**
 * What to show for a signed-in user: their username when the backend provides
 * one, else the localized role label ("Member"/"Admin"). Never the raw user_id.
 */
export function accountDisplayName(
  user: Pick<AuthUser, "username" | "role">,
  roleLabel: string,
): string {
  const name = user.username?.trim();
  return name && name.length > 0 ? name : roleLabel;
}

/** Name of the backend's httpOnly session cookie. */
export const SESSION_COOKIE_NAME = "farms-session";

/**
 * Whether a Cookie header carries the session cookie. Lets callers skip a
 * pointless backend /me round-trip for anonymous visitors (the common case).
 */
export function hasSessionCookie(cookieHeader: string): boolean {
  return new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=`).test(cookieHeader);
}

// Backend rule we mirror client-side (UX only — the backend is authoritative):
// at least 12 characters, at most 1024 bytes, any Unicode, no composition rules.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 1024;

// Deliberately permissive: a single @, no spaces, a dot in the domain. The
// backend does the authoritative check; this only catches obvious typos.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailFormat(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Returns an i18n key describing the problem, or null when the password is OK. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "auth_err_password_short";
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "auth_err_password_long";
  }
  return null;
}

// Username rules mirrored from the backend (UX only — the backend stays
// authoritative, and is the sole source of truth for *uniqueness*).
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
// Start with a letter/digit, then letters/digits/_/-. Checked on the
// already-lowercased value.
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "system",
  "farms",
  "api",
  "moderator",
  "mod",
  "null",
  "undefined",
]);

export type UsernameError =
  | "auth_err_username_short"
  | "auth_err_username_long"
  | "auth_err_username_invalid"
  | "auth_err_username_reserved";

/** What's actually submitted to (and stored by) the backend: trimmed + lower. */
export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Validate a username client-side; returns an i18n key or null. */
export function validateUsername(raw: string): UsernameError | null {
  const value = normaliseUsername(raw);
  if (value.length < USERNAME_MIN_LENGTH) {
    return "auth_err_username_short";
  }
  if (value.length > USERNAME_MAX_LENGTH) {
    return "auth_err_username_long";
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "auth_err_username_invalid";
  }
  if (RESERVED_USERNAMES.has(value)) {
    return "auth_err_username_reserved";
  }
  return null;
}

/** Map a backend auth response status to a user-facing i18n key. */
export function mapAuthError(status: number): string {
  switch (status) {
    case 400:
      return "auth_err_invalid";
    case 401:
      return "auth_err_credentials";
    case 429:
      return "auth_err_rate_limited";
    default:
      return "auth_err_generic";
  }
}

/**
 * Defense-in-depth CSRF check for mutating route handlers: when the browser
 * sends an Origin (it does on cross-origin POSTs), its host must match the
 * request's own host. Absent Origin/Referer we allow it and rely on the
 * SameSite=Lax session cookie. Pure over a Request's headers.
 */
export function isSameOrigin(request: Request): boolean {
  const origin =
    request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) {
    return true;
  }
  const host = request.headers.get("host");
  if (!host) {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
