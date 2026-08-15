import { CATEGORY_CATALOG, KNOWN_CATEGORY_KEYS } from "@/lib/categories";
import { PRODUCTS, productKeyForSlug } from "@/lib/products";

const MAX_IMPORTED_PRODUCTS = 8;
const VALID_KEYS = new Set([...KNOWN_CATEGORY_KEYS, ...Object.keys(PRODUCTS)]);

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function validKeys(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => VALID_KEYS.has(key));
}

const LABEL_INDEX = [
  ...Object.entries(CATEGORY_CATALOG).flatMap(([key, meta]) =>
    [key, ...Object.values(meta.labels)].map((label) => ({ key, label })),
  ),
  ...Object.entries(PRODUCTS).flatMap(([key, meta]) =>
    [key, ...Object.values(meta.labels)].map((label) => ({ key, label })),
  ),
]
  .map(({ key, label }) => ({ key, label: normalize(label) }))
  .filter(({ label }) => label.length > 1)
  .sort((left, right) => right.label.length - left.label.length);

/**
 * Turn an incoming Web Share Target request into canonical quick-search keys.
 * Explicit quick-search/product URLs win; otherwise localized catalog labels
 * are detected in the shared title and text. Unknown content is ignored.
 */
export function productsFromShareTarget(params: URLSearchParams): string[] {
  if (!["title", "text", "url"].some((key) => params.has(key))) {
    return [];
  }

  const selected: string[] = [];
  const add = (key: string | undefined) => {
    if (
      key &&
      VALID_KEYS.has(key) &&
      !selected.includes(key) &&
      selected.length < MAX_IMPORTED_PRODUCTS
    ) {
      selected.push(key);
    }
  };

  const sharedUrl = params.get("url");
  if (sharedUrl) {
    try {
      const url = new URL(sharedUrl, "https://share-target.invalid");
      validKeys(url.searchParams.get("products")).forEach(add);
      validKeys(url.searchParams.get("cat")).forEach(add);

      const parts = url.pathname.split("/").filter(Boolean);
      const productIndex = parts.lastIndexOf("product");
      if (productIndex >= 0) {
        add(productKeyForSlug(parts[productIndex + 1] ?? ""));
      }
    } catch {
      // A malformed shared URL should not prevent title/text matching.
    }
  }

  const haystack = normalize(
    [params.get("title"), params.get("text")].filter(Boolean).join(" "),
  );
  const paddedHaystack = ` ${haystack} `;
  for (const { key, label } of LABEL_INDEX) {
    if (paddedHaystack.includes(` ${label} `)) {
      add(key);
    }
  }

  return selected;
}
