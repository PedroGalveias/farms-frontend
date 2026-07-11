import { describe, expect, it } from "vitest";
import {
  categoryForSlug,
  getProductSlugs,
  getTopCantonsForCategory,
  slugForCategory,
} from "@/lib/product-pages";
import { KNOWN_CATEGORY_KEYS } from "@/lib/categories";
import type { Farm } from "@/types/farm";

function farm(id: string, canton: string, categories: string[]): Farm {
  return {
    id,
    name: `Farm ${id}`,
    address: "Dorfstrasse 1",
    canton,
    coordinates: "46.9,7.4",
    categories,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  };
}

describe("product-pages", () => {
  it("slug ↔ category mapping is a clean bijection", () => {
    const slugs = getProductSlugs();
    expect(slugs.length).toBeGreaterThanOrEqual(12);
    for (const slug of slugs) {
      const category = categoryForSlug(slug);
      expect(category).not.toBeNull();
      expect(slugForCategory(category!)).toBe(slug);
      // Public URLs: lowercase ASCII + hyphens only.
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      // Every slug maps to a real catalog category.
      expect(KNOWN_CATEGORY_KEYS).toContain(category);
    }
  });

  it("has no page for the 'Other' bucket", () => {
    expect(slugForCategory("Sonstiges")).toBeNull();
    expect(getProductSlugs()).not.toContain("other");
  });

  it("rejects unknown slugs (and is case-insensitive for known ones)", () => {
    expect(categoryForSlug("does-not-exist")).toBeNull();
    expect(categoryForSlug("DAIRY")).toBe("Milchprodukte");
  });

  it("ranks cantons by how many farms offer the category", () => {
    const farms = [
      farm("a", "BE", ["Früchte"]),
      farm("b", "BE", ["Früchte", "Gemüse"]),
      farm("c", "ZH", ["Früchte"]),
      farm("d", "VD", ["Gemüse"]),
    ];
    expect(getTopCantonsForCategory(farms, "Früchte")).toEqual([
      ["BE", 2],
      ["ZH", 1],
    ]);
    // Ties break alphabetically for a stable page.
    expect(getTopCantonsForCategory(farms, "Gemüse")).toEqual([
      ["BE", 1],
      ["VD", 1],
    ]);
    expect(getTopCantonsForCategory(farms, "Getränke")).toEqual([]);
  });
});
