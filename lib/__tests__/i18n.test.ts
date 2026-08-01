import { describe, expect, it } from "vitest";
import {
  LOCALES,
  LOCALE_CODES,
  MESSAGES,
  isLocale,
  localeAlternates,
  localeFromAcceptLanguage,
  localizedPath,
  translate,
  unlocalizedPath,
  type Locale,
} from "@/lib/i18n";

describe("localeFromAcceptLanguage", () => {
  it("falls back to English when the header is empty or unsupported", () => {
    expect(localeFromAcceptLanguage(null)).toBe("en");
    expect(localeFromAcceptLanguage("es-ES,es;q=0.9")).toBe("en");
  });

  it("matches a supported language, ignoring the region subtag", () => {
    expect(localeFromAcceptLanguage("de-CH,de;q=0.9")).toBe("de");
    expect(localeFromAcceptLanguage("fr-FR")).toBe("fr");
  });

  it("respects q-value ordering over list order", () => {
    expect(localeFromAcceptLanguage("en;q=0.6,it;q=0.9")).toBe("it");
  });
});

describe("translate", () => {
  it("returns the message for the requested locale", () => {
    expect(translate("de", "nav_directory")).toBe(MESSAGES.de.nav_directory);
  });

  it("interpolates {var} placeholders", () => {
    expect(translate("en", "toolbar_shown", { n: 5 })).toBe("5 shown");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "results_showing", { shown: 3 })).toContain(
      "{total}",
    );
  });

  it("falls back to English when a key is missing in a locale", () => {
    // A key that exists in English is returned even for another locale.
    expect(translate("rm", "nav_directory")).toBeTruthy();
  });

  it("returns the key itself when it exists nowhere", () => {
    expect(translate("en", "definitely_missing_key")).toBe(
      "definitely_missing_key",
    );
  });
});

describe("locale dictionaries", () => {
  const englishKeys = Object.keys(MESSAGES.en);
  const otherLocales = LOCALES.map((l) => l.code).filter(
    (code): code is Locale => code !== "en",
  );

  it.each(otherLocales)(
    "locale '%s' defines every English key (no gaps)",
    (locale) => {
      const missing = englishKeys.filter((key) => !(key in MESSAGES[locale]));
      expect(missing).toEqual([]);
    },
  );

  it("exposes all five supported locales", () => {
    expect(LOCALES.map((l) => l.code)).toEqual(["en", "de", "fr", "it", "rm"]);
  });
});

describe("locale-aware URLs", () => {
  it("validates locale codes", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("keeps English unprefixed and prefixes the rest", () => {
    expect(localizedPath("/canton/be", "en")).toBe("/canton/be");
    expect(localizedPath("/canton/be", "de")).toBe("/de/canton/be");
    expect(localizedPath("/", "fr")).toBe("/fr");
    expect(localizedPath("/", "en")).toBe("/");
    expect(localizedPath("settings", "it")).toBe("/it/settings");
  });

  it("emits hreflang alternates for every locale plus x-default", () => {
    const { canonical, languages } = localeAlternates("/product/dairy");
    expect(canonical).toBe("/product/dairy");
    expect(languages.en).toBe("/product/dairy");
    expect(languages.de).toBe("/de/product/dairy");
    expect(languages.rm).toBe("/rm/product/dairy");
    expect(languages["x-default"]).toBe("/product/dairy");
    expect(Object.keys(languages)).toHaveLength(LOCALE_CODES.length + 1);
  });
});

describe("unlocalizedPath", () => {
  it("strips a leading locale segment", () => {
    expect(unlocalizedPath("/de/saved")).toBe("/saved");
    expect(unlocalizedPath("/fr/canton/be")).toBe("/canton/be");
    expect(unlocalizedPath("/rm/quick-search")).toBe("/quick-search");
  });

  it("leaves an unprefixed path alone", () => {
    expect(unlocalizedPath("/saved")).toBe("/saved");
    expect(unlocalizedPath("/")).toBe("/");
  });

  it("maps a bare locale root to /", () => {
    // /de is the German home page, so it must compare equal to "/".
    for (const code of ["de", "fr", "it", "rm", "en"]) {
      expect(unlocalizedPath(`/${code}`)).toBe("/");
    }
  });

  it("only strips whole segments", () => {
    // "/dessert" is a page about desserts, not a German page about "ssert".
    expect(unlocalizedPath("/dessert")).toBe("/dessert");
    expect(unlocalizedPath("/italy")).toBe("/italy");
    expect(unlocalizedPath("/french-beans")).toBe("/french-beans");
  });

  it("round-trips with localizedPath", () => {
    for (const code of LOCALE_CODES) {
      for (const path of ["/", "/saved", "/canton/be"]) {
        expect(unlocalizedPath(localizedPath(path, code))).toBe(path);
      }
    }
  });
});
