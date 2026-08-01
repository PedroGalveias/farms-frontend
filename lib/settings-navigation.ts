import { unlocalizedPath } from "@/lib/i18n-core";

export const SETTINGS_RETURN_TO_PARAM = "returnTo";

/**
 * An app-owned return target is attached only when Settings is opened from
 * inside the app. A direct visit has no target and therefore cannot navigate
 * back to an unrelated browser-history entry.
 */
export function settingsHref(pathname: string): string {
  const source = unlocalizedPath(pathname);
  if (source === "/settings") return "/settings";

  return `/settings?${SETTINGS_RETURN_TO_PARAM}=${encodeURIComponent(source)}`;
}

/** Return a safe, locale-neutral in-app target, or null for a direct visit. */
export function settingsReturnTo(value: string | null): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;

  const target = unlocalizedPath(value);
  return target === "/settings" ? null : target;
}
