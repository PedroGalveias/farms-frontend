import { canonicalCategory } from "@/lib/categories";
import { productGroupOf } from "@/lib/products";
import { getCategoryCounts } from "@/lib/directory";
import { getUniqueFarmCantons, getUniqueFarmCategories } from "@/lib/farms";
import type { Farm } from "@/types/farm";

/**
 * The filter options a directory can offer, and how many farms sit behind each.
 *
 * This is deliberately *not* derived from the farms being displayed. A picker
 * built from the current result set can only offer what that set contains — so
 * the moment the directory shows a filtered subset, its canton list holds only
 * the canton already selected and a visitor cannot get back out. That single
 * fact is what has kept the directory downloading all ~3,155 farms on every
 * route with a filter UI.
 */
export interface DirectoryFacets {
  /** Canton codes with at least one farm, sorted. */
  cantons: string[];
  /** Canonical category keys with at least one farm, sorted by name. */
  categories: string[];
  /** Canonical category key → farms in it across the whole directory. */
  categoryCounts: Record<string, number>;
  /** Every farm in the directory, not just the ones on screen. */
  total: number;
}

/** One canton entry as `GET /facets` returns it. */
interface ApiCantonFacet {
  code: string;
  count: number;
}

/** One category entry as `GET /facets` returns it. */
interface ApiCategoryFacet {
  slug: string;
  name: string;
  count: number;
}

/** The `GET /facets` body. */
export interface ApiFacets {
  total: number;
  cantons: ApiCantonFacet[];
  categories: ApiCategoryFacet[];
}

function isCantonFacet(value: unknown): value is ApiCantonFacet {
  const entry = value as Partial<ApiCantonFacet> | null;
  return (
    !!entry && typeof entry.code === "string" && typeof entry.count === "number"
  );
}

function isCategoryFacet(value: unknown): value is ApiCategoryFacet {
  const entry = value as Partial<ApiCategoryFacet> | null;
  return (
    !!entry && typeof entry.slug === "string" && typeof entry.count === "number"
  );
}

/**
 * Validate a `GET /facets` body, or return `null` if it is not one.
 *
 * Returning null rather than throwing is deliberate: facets are an
 * optimisation, and a directory that renders from the farm list is strictly
 * better than one that errors. Every caller falls back to
 * {@link facetsFromFarms}.
 */
export function parseApiFacets(body: unknown): ApiFacets | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const candidate = body as Partial<ApiFacets>;
  if (
    typeof candidate.total !== "number" ||
    !Array.isArray(candidate.cantons) ||
    !Array.isArray(candidate.categories) ||
    !candidate.cantons.every(isCantonFacet) ||
    !candidate.categories.every(isCategoryFacet)
  ) {
    return null;
  }
  return {
    total: candidate.total,
    cantons: candidate.cantons,
    categories: candidate.categories,
  };
}

/**
 * Fold an API response into the shape the directory works in.
 *
 * Two folds, in this order, because that is exactly what the farm path does and
 * the two must not disagree:
 *
 *   1. `canonicalCategory` turns an API slug into a German catalogue key
 *      (`fruits` → `Früchte`). On the farm path this is `normalizeFarmCategories`,
 *      applied at the service boundary.
 *   2. `productGroupOf` folds a key onto its display group (`Käse` →
 *      `Milchprodukte`). On the farm path this is `getFarmGroups`.
 *
 * Neither alone is enough, and they are not interchangeable: `productGroupOf`
 * leaves a raw slug untouched (`fruits` → `fruits`), and `canonicalCategory`
 * sends `Eier` to `Sonstiges` where the group fold keeps it. Getting this wrong
 * shows up as a picker whose chips and counts disagree with the list.
 *
 * Zero counts are dropped: the API returns the whole vocabulary so a client can
 * grey options out, but this directory has always listed only categories that
 * have farms, and changing that is a design decision, not a refactor.
 */
export function facetsFromApi(api: ApiFacets): DirectoryFacets {
  const categoryCounts: Record<string, number> = {};
  for (const entry of api.categories) {
    if (entry.count <= 0) {
      continue;
    }
    const key = productGroupOf(canonicalCategory(entry.slug));
    // Several slugs can land on one display group; sum rather than overwrite.
    categoryCounts[key] = (categoryCounts[key] ?? 0) + entry.count;
  }

  return {
    cantons: api.cantons
      .filter((entry) => entry.count > 0)
      .map((entry) => entry.code)
      .sort((a, b) => a.localeCompare(b)),
    categories: Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b)),
    categoryCounts,
    total: api.total,
  };
}

/**
 * Derive the same shape from a farm list.
 *
 * The fallback, and still correct whenever the directory holds every farm —
 * which is the case today and stays the case until filtering moves server-side.
 * Keeping both paths behind one type is what lets that move happen without
 * touching the components.
 */
export function facetsFromFarms(farms: Farm[]): DirectoryFacets {
  return {
    cantons: getUniqueFarmCantons(farms),
    categories: getUniqueFarmCategories(farms),
    categoryCounts: getCategoryCounts(farms),
    total: farms.length,
  };
}
