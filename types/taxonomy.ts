import type { Locale } from "@/lib/i18n-core";

/** A localized category returned by the farms API taxonomy endpoint. */
export interface FarmTaxonomyCategory {
  name: string;
  slug: string;
  translated: boolean;
}

/** A localized product returned by the farms API taxonomy endpoint. */
export interface FarmTaxonomyProduct {
  category: string;
  name: string;
  slug: string;
  translated: boolean;
}

/** The complete filtering vocabulary for one resolved API language. */
export interface FarmTaxonomy {
  categories: FarmTaxonomyCategory[];
  lang: Locale;
  products: FarmTaxonomyProduct[];
}
