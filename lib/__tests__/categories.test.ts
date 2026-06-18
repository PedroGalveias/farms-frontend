import { describe, expect, it } from "vitest";
import {
  CATEGORY_CATALOG,
  KNOWN_CATEGORY_KEYS,
  categoryEmoji,
  categoryLabel,
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
