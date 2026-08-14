import type { Locale } from "@/lib/i18n-core";

export interface TaxonomyEntry {
  /** Stable API identity. */
  slug: string;
  /** Label in the requested locale, or the backend's explicit fallback. */
  name: string;
  /** Whether `name` is genuinely translated into the requested locale. */
  translated: boolean;
}

export interface TaxonomyProduct extends TaxonomyEntry {
  /** Stable category slug from the same response. */
  category: string;
}

export interface FarmTaxonomy {
  lang: Locale;
  categories: TaxonomyEntry[];
  products: TaxonomyProduct[];
}
