// Locale primitives WITHOUT the message dictionaries. Client components import
// from here so the ~110 kB five-locale table in lib/i18n.ts stays server-side:
// the layout resolves the URL's locale and hands ONLY that locale's strings to
// LanguageProvider through the RSC payload. Anything exported here must stay
// dictionary-free — importing lib/i18n from client code drags all five locales
// back into the bundle.

export type Locale = "en" | "de" | "fr" | "it" | "rm";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "rm", label: "Rumantsch" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "farms.locale";

/** All locale codes, for [lang] static params and the proxy. */
export const LOCALE_CODES: Locale[] = ["en", "de", "fr", "it", "rm"];

export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as string[]).includes(value);
}

/**
 * The public URL for `path` in `locale`. English is canonical and unprefixed
 * (/canton/be); the other locales carry their segment (/de/canton/be).
 */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * The inverse of `localizedPath`: strip a leading locale segment so a route can
 * be compared against a plain path.
 *
 * Needed because `usePathname()` returns what is actually in the URL, so
 * `pathname === "/saved"` is false for every visitor who is not reading in
 * English — which is how the side rail ended up highlighting nothing at all on
 * /de, /fr, /it and /rm.
 *
 * Only a whole first segment counts: "/dessert" is a page about desserts, not a
 * German page about "ssert".
 */
export function unlocalizedPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const [, first, ...rest] = clean.split("/");
  if (!isLocale(first)) return clean;
  const remainder = rest.join("/");
  return remainder ? `/${remainder}` : "/";
}

/**
 * hreflang alternates for a page, for `metadata.alternates`: one URL per
 * locale plus x-default pointing at the unprefixed English page.
 */
export function localeAlternates(path: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};
  for (const code of LOCALE_CODES) {
    languages[code] = localizedPath(path, code);
  }
  languages["x-default"] = localizedPath(path, DEFAULT_LOCALE);
  return { canonical: localizedPath(path, DEFAULT_LOCALE), languages };
}

/** `{name}` placeholder interpolation — the client half of translate(). */
export function interpolate(
  raw: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) {
    return raw;
  }
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

/** A single locale's key → string table. */
export type Dict = Record<string, string>;

/**
 * Prefix an app-absolute href with `locale`, leaving everything else alone.
 *
 * Extracted from `LocalizedLink` so a *server* component can build the same
 * href without pulling the language context — and therefore itself — into the
 * client bundle. `LocalizedLink` now calls this too: one implementation, so a
 * server-rendered link and a client-rendered one can never disagree about
 * where they point.
 *
 * Untouched: external URLs, protocol-relative, hashes, mailto/tel, query-only
 * or object hrefs, and paths that already carry a locale segment.
 */
export function localizeHref<T>(href: T, locale: Locale): T | string {
  if (typeof href !== "string") return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  // Split on the FIRST delimiter only and keep the rest verbatim. `split()`
  // discards everything after a second "?" or "#", so "/a?q=x#b#c" lost "#c"
  // and a query containing a literal "#" was truncated.
  const hashAt = href.indexOf("#");
  const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : href.slice(hashAt);

  const queryAt = beforeHash.indexOf("?");
  const path = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
  const query = queryAt === -1 ? "" : beforeHash.slice(queryAt);

  const [, first] = path.split("/");
  if (isLocale(first)) return href;

  return `${localizedPath(path, locale)}${query}${hash}`;
}
