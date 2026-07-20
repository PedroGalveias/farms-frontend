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

  it("rolls leaked subcategories up to their canonical group", () => {
    // Verified against the live dataset's 32 groups (2026-07-14).
    expect(canonicalCategory("Beeren")).toBe("Früchte");
    expect(canonicalCategory("Kernobst")).toBe("Früchte");
    expect(canonicalCategory("Wurzelgemüse")).toBe("Gemüse");
    expect(canonicalCategory("Zwiebelgemüse")).toBe("Gemüse");
    expect(canonicalCategory("Fruchtsäfte")).toBe("Getränke");
    expect(canonicalCategory("Weine")).toBe("Getränke");
    expect(canonicalCategory("Eier")).toBe("Sonstiges");
    expect(canonicalCategory("Freilandeier")).toBe("Sonstiges");
    expect(canonicalCategory("Schalenobst und Nüsse")).toBe(
      "Nüsse, Samen und Öle",
    );
  });

  it("folds taxonomy-aware backend group slugs to canonical keys", () => {
    // The new backend sends English group slugs; every one must resolve to a
    // real catalog key so labels, icons and facet counts stay stable.
    const slugToKey: Record<string, string> = {
      fruits: "Früchte",
      vegetables: "Gemüse",
      dairy: "Milchprodukte",
      "meat-poultry": "Fleisch und Geflügel",
      preserves: "Verarbeitete und haltbare Produkte",
      "honey-sweeteners": "Honig und Süßstoffe",
      drinks: "Getränke",
      bakery: "Backwaren und Gebäck",
      "flowers-plants": "Blumen und Pflanzen",
      "nuts-oils": "Nüsse, Samen und Öle",
      grains: "Getreide und Cerealien",
      "fish-seafood": "Fisch und Meeresfrüchte",
      other: "Sonstiges",
    };
    for (const [slug, key] of Object.entries(slugToKey)) {
      expect(canonicalCategory(slug)).toBe(key);
      expect(KNOWN_CATEGORY_KEYS).toContain(key);
    }
  });

  it("normalizes a mixed old/new-backend category list to one vocabulary", () => {
    // A German group, an English slug for the same group, and a subcategory —
    // all collapse to a single canonical key.
    expect(normalizeFarmCategories(["Früchte", "fruits", "Beeren"])).toEqual([
      "Früchte",
    ]);
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
