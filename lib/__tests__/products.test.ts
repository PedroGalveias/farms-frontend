import { describe, expect, it } from "vitest";
import {
  PRODUCTS,
  PRODUCTS_BY_GROUP,
  productGroupOf,
  productKeyForSlug,
  productLabel,
  productSlug,
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
  it("translates a product, falling back to English for unmapped locales", () => {
    expect(productLabel("Erdbeeren", "en")).toBe("Strawberries");
    expect(productLabel("Erdbeeren", "de")).toBe("Erdbeeren");
    // fr/it/rm fall back to English until authored.
    expect(productLabel("Erdbeeren", "fr")).toBe("Strawberries");
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

  it("groups all 13 categories and a healthy number of products", () => {
    expect(Object.keys(PRODUCTS_BY_GROUP).sort()).toEqual(
      [...KNOWN_CATEGORY_KEYS].sort(),
    );
    expect(Object.keys(PRODUCTS).length).toBeGreaterThan(150);
  });
});

describe("productSlug", () => {
  it("derives the backend product slug from the English label", () => {
    expect(productSlug("Erdbeeren")).toBe("strawberries");
    expect(productSlug("Kirschen")).toBe("cherries");
    expect(productSlug("Ananas")).toBe("pineapple");
  });

  it("is a valid slug for every catalog product (lowercase a-z0-9-)", () => {
    for (const key of Object.keys(PRODUCTS)) {
      expect(productSlug(key)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("produces a unique slug per product (no collisions)", () => {
    const slugs = Object.keys(PRODUCTS).map(productSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("round-trips through productKeyForSlug", () => {
    for (const key of Object.keys(PRODUCTS)) {
      expect(productKeyForSlug(productSlug(key))).toBe(key);
    }
    expect(productKeyForSlug("no-such-slug")).toBeUndefined();
  });
});
