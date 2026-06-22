import { describe, expect, it } from "vitest";
import {
  LOCALES,
  MESSAGES,
  localeFromAcceptLanguage,
  translate,
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
