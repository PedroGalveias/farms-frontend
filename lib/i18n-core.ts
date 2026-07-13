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
