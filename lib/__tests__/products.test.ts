import { describe, expect, it } from "vitest";
import {
  PRODUCTS,
  PRODUCTS_BY_GROUP,
  productGroupOf,
  productLabel,
  tagLabel,
} from "@/lib/products";
import { KNOWN_CATEGORY_KEYS } from "@/lib/categories";

describe("productGroupOf", () => {
  it("rolls a granular product up to its category group", () => {
    expect(productGroupOf("Erdbeeren")).toBe("Früchte");
    expect(productGroupOf("Karotten")).toBe("Gemüse");
  });

  it("returns a group value unchanged (so group-level data still works)", () => {
    expect(productGroupOf("Früchte")).toBe("Früchte");
  });

  it("returns unknown values unchanged", () => {
    expect(productGroupOf("Vegetables")).toBe("Vegetables");
  });
});

describe("productLabel / tagLabel", () => {
  it("translates a product into every locale", () => {
    expect(productLabel("Erdbeeren", "en")).toBe("Strawberries");
    expect(productLabel("Erdbeeren", "de")).toBe("Erdbeeren");
    expect(productLabel("Erdbeeren", "fr")).toBe("Fraises");
    expect(productLabel("Erdbeeren", "it")).toBe("Fragole");
    expect(productLabel("Erdbeeren", "rm")).toBe("Fraulas");
  });

  it("falls back to the key for an unknown product", () => {
    expect(productLabel("Nonexistent", "fr")).toBe("Nonexistent");
  });

  it("tagLabel handles both products and category groups", () => {
    expect(tagLabel("Erdbeeren", "en")).toBe("Strawberries");
    expect(tagLabel("Früchte", "en")).toBe("Fruits");
    expect(tagLabel("Unknown thing", "en")).toBe("Unknown thing");
  });
});

describe("taxonomy integrity", () => {
  it("every product belongs to a known category group", () => {
    for (const meta of Object.values(PRODUCTS)) {
      expect(KNOWN_CATEGORY_KEYS).toContain(meta.group);
    }
  });

  it("PRODUCTS_BY_GROUP is consistent with PRODUCTS", () => {
    for (const [group, products] of Object.entries(PRODUCTS_BY_GROUP)) {
      for (const product of products) {
        expect(PRODUCTS[product]?.group).toBe(group);
      }
    }
  });

  it("defines a label in every locale for every product", () => {
    const locales = ["de", "en", "fr", "it", "rm"] as const;
    const gaps = Object.entries(PRODUCTS).flatMap(([key, meta]) =>
      locales
        .filter((locale) => !meta.labels[locale]?.trim())
        .map((locale) => `${key}:${locale}`),
    );
    expect(gaps).toEqual([]);
  });

  it("groups all 13 categories and a healthy number of products", () => {
    expect(Object.keys(PRODUCTS_BY_GROUP).sort()).toEqual(
      [...KNOWN_CATEGORY_KEYS].sort(),
    );
    expect(Object.keys(PRODUCTS).length).toBeGreaterThan(150);
  });
});
