import { describe, expect, it } from "vitest";
import {
  parseFarmTaxonomy,
  taxonomyCategoryLabel,
  taxonomyProductLabel,
  taxonomyTagLabel,
} from "@/lib/taxonomy";

const taxonomy = parseFarmTaxonomy({
  lang: "fr",
  categories: [
    { slug: "vegetables", name: "Légumes", translated: true },
    { slug: "fruits", name: "Fruits", translated: true },
  ],
  products: [
    {
      slug: "strawberries",
      name: "Strawberries",
      translated: false,
      category: "fruits",
    },
  ],
});

describe("farm taxonomy", () => {
  it("validates the live response shape", () => {
    expect(taxonomy?.lang).toBe("fr");
    expect(
      parseFarmTaxonomy({ lang: "fr", categories: [], products: [{}] }),
    ).toBeNull();
  });

  it("rejects products whose category is absent", () => {
    expect(
      parseFarmTaxonomy({
        lang: "fr",
        categories: [
          { slug: "vegetables", name: "Légumes", translated: true },
        ],
        products: [
          {
            slug: "strawberries",
            name: "Fraises",
            translated: true,
            category: "fruits",
          },
        ],
      }),
    ).toBeNull();
  });

  it("uses API labels and preserves an explicit untranslated fallback", () => {
    expect(taxonomyCategoryLabel(taxonomy, "Gemüse", "fr")).toBe("Légumes");
    expect(taxonomyProductLabel(taxonomy, "Erdbeeren", "fr")).toBe(
      "Strawberries",
    );
  });

  it("prefers a product when a key is also a category alias", () => {
    expect(taxonomyTagLabel(null, "Honig", "en")).toBe("Honey");
  });
});
