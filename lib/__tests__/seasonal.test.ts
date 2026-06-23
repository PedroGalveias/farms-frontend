import { describe, expect, it } from "vitest";
import {
  SEASONAL_BY_MONTH,
  SEASONAL_PRODUCE,
  produceEmoji,
  produceLabel,
  seasonalGroupsForMonth,
  seasonalProductsForMonth,
} from "@/lib/seasonal";
import { KNOWN_CATEGORY_KEYS } from "@/lib/categories";
import { PRODUCTS } from "@/lib/products";
import { LOCALES, type Locale } from "@/lib/i18n";

describe("seasonalProductsForMonth", () => {
  it("returns specific product keys for in-season items (e.g. June cherries)", () => {
    const june = seasonalProductsForMonth(5);
    expect(june).toContain("Kirschen");
  });

  it("only returns keys quick search understands (a product or a group)", () => {
    for (let month = 0; month < 12; month++) {
      for (const key of seasonalProductsForMonth(month)) {
        const known = key in PRODUCTS || KNOWN_CATEGORY_KEYS.includes(key);
        expect(known).toBe(true);
      }
    }
  });
});

describe("seasonalGroupsForMonth", () => {
  it("returns the distinct category groups in season for a month", () => {
    // June (index 5): strawberries/cherries/apricots (Früchte) +
    // cucumbers/lettuce/peas (Gemüse).
    expect(seasonalGroupsForMonth(5).sort()).toEqual(["Früchte", "Gemüse"]);
  });

  it("only returns known category groups for every month", () => {
    for (let month = 0; month < 12; month++) {
      for (const group of seasonalGroupsForMonth(month)) {
        expect(KNOWN_CATEGORY_KEYS).toContain(group);
      }
    }
  });
});

describe("produceLabel", () => {
  it("translates a known item into the requested locale", () => {
    expect(produceLabel("apples", "en")).toBe("Apples");
    expect(produceLabel("apples", "de")).toBe("Äpfel");
    expect(produceLabel("apples", "fr")).toBe("Pommes");
    expect(produceLabel("apples", "it")).toBe("Mele");
  });

  it("falls back to the raw key for an unmapped item", () => {
    expect(produceLabel("dragonfruit", "en")).toBe("dragonfruit");
  });
});

describe("produceEmoji", () => {
  it("returns the emoji for a known item, fallback otherwise", () => {
    expect(produceEmoji("strawberries")).toBe("🍓");
    expect(produceEmoji("dragonfruit")).toBe("🧺");
  });
});

describe("seasonal catalog", () => {
  const locales = LOCALES.map((l) => l.code);
  const keys = Object.keys(SEASONAL_PRODUCE);

  it.each(keys)("'%s' has an emoji and a label in every locale", (key) => {
    const item = SEASONAL_PRODUCE[key];
    expect(item.emoji).toBeTruthy();
    const missing = locales.filter(
      (locale: Locale) => !item.labels[locale]?.trim(),
    );
    expect(missing).toEqual([]);
  });

  it("covers all 12 months, each referencing known produce", () => {
    expect(SEASONAL_BY_MONTH).toHaveLength(12);
    for (const month of SEASONAL_BY_MONTH) {
      expect(month.length).toBeGreaterThan(0);
      for (const key of month) {
        expect(SEASONAL_PRODUCE[key]).toBeDefined();
      }
    }
  });
});
