import { describe, expect, it } from "vitest";
import {
  CATEGORY_CATALOG,
  KNOWN_CATEGORY_KEYS,
  categoryEmoji,
  categoryLabel,
  canonicalCategory,
  CATEGORY_ALIASES,
  normalizeFarmCategories,
} from "@/lib/categories";
import { LOCALES, type Locale } from "@/lib/i18n";

describe("categoryLabel", () => {
  it("translates a known category into the requested locale", () => {
    expect(categoryLabel("Früchte", "en")).toBe("Fruits");
    expect(categoryLabel("Früchte", "fr")).toBe("Fruits");
    expect(categoryLabel("Gemüse", "it")).toBe("Verdura");
    expect(categoryLabel("Gemüse", "de")).toBe("Gemüse");
  });

  it("falls back to the raw key for an unmapped category", () => {
    expect(categoryLabel("Pilze", "en")).toBe("Pilze");
  });
});

describe("categoryEmoji", () => {
  it("returns the catalog emoji for a known category", () => {
    expect(categoryEmoji("Milchprodukte")).toBe("🥛");
  });

  it("returns a neutral fallback for an unmapped category", () => {
    expect(categoryEmoji("Pilze")).toBe("🧺");
  });
});

describe("category catalog completeness", () => {
  const locales = LOCALES.map((l) => l.code);

  it.each(KNOWN_CATEGORY_KEYS)(
    "category '%s' defines a label for every locale and an emoji",
    (key) => {
      const meta = CATEGORY_CATALOG[key];
      expect(meta.emoji).toBeTruthy();
      const missing = locales.filter(
        (locale: Locale) => !meta.labels[locale]?.trim(),
      );
      expect(missing).toEqual([]);
    },
  );

  it("uses the German key as its own `de` label", () => {
    for (const key of KNOWN_CATEGORY_KEYS) {
      expect(CATEGORY_CATALOG[key].labels.de).toBe(key);
    }
  });
});

describe("category canonicalisation", () => {
  it("maps known German variants onto catalog keys", () => {
    expect(canonicalCategory("Früchte und Obst")).toBe("Früchte");
    expect(canonicalCategory("Fleisch")).toBe("Fleisch und Geflügel");
    expect(canonicalCategory("  Honig ")).toBe("Honig und Süßstoffe");
  });

  it("passes canonical and unknown values through untouched", () => {
    expect(canonicalCategory("Gemüse")).toBe("Gemüse");
    expect(canonicalCategory("Brandneue Gruppe")).toBe("Brandneue Gruppe");
  });

  it("every alias points at a real catalog key", () => {
    for (const target of Object.values(CATEGORY_ALIASES)) {
      expect(KNOWN_CATEGORY_KEYS).toContain(target);
    }
  });

  it("normalizeFarmCategories de-duplicates after aliasing", () => {
    expect(
      normalizeFarmCategories(["Früchte", "Früchte und Obst", "Obst"]),
    ).toEqual(["Früchte"]);
  });
});
