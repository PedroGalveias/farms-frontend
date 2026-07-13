// The five locale dictionaries + server-side translate(). Client code must
// NOT import this module: it drags all five tables (~110 kB) into the bundle.
// Import locale primitives from lib/i18n-core instead — the layout hands the
// active locale's strings to LanguageProvider through the RSC payload, and
// the client falls back to lib/messages/en for missing keys.
import { en } from "@/lib/messages/en";
import { de } from "@/lib/messages/de";
import { fr } from "@/lib/messages/fr";
import { it } from "@/lib/messages/it";
import { rm } from "@/lib/messages/rm";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n-core";
import type { Dict } from "@/lib/i18n-core";

// Everything locale-primitive lives in i18n-core; re-export so the ~50
// existing server/test imports of "@/lib/i18n" keep working unchanged.
export * from "@/lib/i18n-core";

export const MESSAGES: Record<Locale, Dict> = { en, de, fr, it, rm };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = MESSAGES[locale]?.[key] ?? en[key] ?? key;
  if (!vars) {
    return raw;
  }
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

/**
 * Best-effort locale negotiation from an HTTP `Accept-Language` header, used to
 * localize server-rendered metadata (the client locale lives in localStorage
 * and isn't available during render). Falls back to the default locale.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }
  const supported = new Set<Locale>(LOCALES.map((entry) => entry.code));
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .sort((left, right) => right.quality - left.quality);

  for (const { base } of ranked) {
    if (supported.has(base as Locale)) {
      return base as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

// ---------- Locale-aware URLs ----------

/** All locale codes, for [lang] static params and the middleware. */
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
    // Swiss-flavoured hreflang tags (de-CH etc.) plus the bare language.
    languages[code] = localizedPath(path, code);
  }
  languages["x-default"] = localizedPath(path, DEFAULT_LOCALE);
  return { canonical: localizedPath(path, DEFAULT_LOCALE), languages };
}
