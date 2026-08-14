import { categoryLabel, categorySlug } from "@/lib/categories";
import { isLocale, type Locale } from "@/lib/i18n-core";
import { PRODUCTS, productLabel, productSlug } from "@/lib/products";
import type {
  FarmTaxonomy,
  TaxonomyEntry,
  TaxonomyProduct,
} from "@/types/taxonomy";

function isEntry(value: unknown): value is TaxonomyEntry {
  const entry = value as Partial<TaxonomyEntry> | null;
  return (
    !!entry &&
    typeof entry.slug === "string" &&
    entry.slug.length > 0 &&
    typeof entry.name === "string" &&
    entry.name.length > 0 &&
    typeof entry.translated === "boolean"
  );
}

function isProduct(value: unknown): value is TaxonomyProduct {
  const product = value as Partial<TaxonomyProduct> | null;
  return (
    isEntry(value) &&
    typeof product?.category === "string" &&
    product.category.length > 0
  );
}

/** Validate the live `GET /taxonomy` contract without trusting JSON casts. */
export function parseFarmTaxonomy(body: unknown): FarmTaxonomy | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const candidate = body as Partial<FarmTaxonomy>;
  if (
    !isLocale(candidate.lang ?? "") ||
    !Array.isArray(candidate.categories) ||
    !candidate.categories.every(isEntry) ||
    !Array.isArray(candidate.products) ||
    !candidate.products.every(isProduct)
  ) {
    return null;
  }
  return {
    lang: candidate.lang as Locale,
    categories: candidate.categories,
    products: candidate.products,
  };
}

/** Backend label when present, with the existing catalog as offline fallback. */
export function taxonomyCategoryLabel(
  taxonomy: FarmTaxonomy | null | undefined,
  key: string,
  locale: Locale,
): string {
  const slug = categorySlug(key);
  return (
    (slug
      ? taxonomy?.categories.find((entry) => entry.slug === slug)?.name
      : undefined) ?? categoryLabel(key, locale)
  );
}

/**
 * Product label from the backend taxonomy. A `translated: false` label is
 * intentionally still rendered: it is the backend's honest fallback, while
 * the flag remains available for UI/audit tooling instead of pretending the
 * string was translated.
 */
export function taxonomyProductLabel(
  taxonomy: FarmTaxonomy | null | undefined,
  key: string,
  locale: Locale,
): string {
  const slug = productSlug(key);
  return (
    taxonomy?.products.find((entry) => entry.slug === slug)?.name ??
    productLabel(key, locale)
  );
}

export function taxonomyTagLabel(
  taxonomy: FarmTaxonomy | null | undefined,
  key: string,
  locale: Locale,
): string {
  return PRODUCTS[key]
    ? taxonomyProductLabel(taxonomy, key, locale)
    : taxonomyCategoryLabel(taxonomy, key, locale);
}
