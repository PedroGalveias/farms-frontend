import { getCantonName } from "@/lib/farms";
import { PRODUCTS, productGroupOf, productSlug } from "@/lib/products";
import type { Farm } from "@/types/farm";

export type QuickSearchMatchMode = "all" | "any";

export interface QuickSearchCoordinates {
  latitude: number;
  longitude: number;
}

export interface QuickSearchLocation {
  coordinates: QuickSearchCoordinates | null;
  label: string;
}

export interface QuickSearchProduct {
  /** Canonical category key (the German group string the backend stores). */
  category: string;
  farmCount: number;
}

export interface QuickSearchResult {
  distanceKm: number | null;
  farm: Farm;
  locationScore: number;
  matchedProducts: string[];
}

function normalizeSearchValue(value: string) {
  // NFD + stripping combining marks folds Swiss place-name diacritics
  // (Zürich → zurich, Genève → geneve) so typed queries match addresses.
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\beggs\b/g, "egg")
    .replace(/\bfruits\b/g, "fruit")
    .replace(/\bvegetables\b/g, "vegetable")
    .replace(/\bjuices\b/g, "juice")
    .trim();
}

export function productMatchesCategory(product: string, category: string) {
  const left = normalizeSearchValue(product);
  const right = normalizeSearchValue(category);

  if (left.length === 0 || right.length === 0) {
    return false;
  }

  return left.includes(right) || right.includes(left);
}

// A selection can be a category group OR a specific product (subcategory).
//
// When the farm carries real per-product data (the taxonomy-aware backend's
// `products[]`) and the selection is a *known product*, that set is
// authoritative: the farm matches iff it actually lists the product's slug —
// no category rollup — exactly mirroring the backend's own `?product=` filter.
// Picking "strawberries" then matches only farms that list strawberries, not
// every fruit farm.
//
// Otherwise (a group selection, or a farm without granular product data — the
// current backend, or the ~28% group-only farms) we roll the selection up to
// its group and match on the farm's categories, with a fuzzy text fallback.
// This keeps behaviour identical against today's product-less backend and
// sharpens automatically once product data arrives.
function farmMatchesProduct(farm: Farm, product: string) {
  if (farm.products && PRODUCTS[product]) {
    const slug = productSlug(product);
    return farm.products.some((item) => item.slug === slug);
  }

  const selectedGroup = productGroupOf(product);
  return farm.categories.some(
    (category) =>
      productGroupOf(category) === selectedGroup ||
      productMatchesCategory(product, category),
  );
}

export function haversineDistanceKm(
  from: QuickSearchCoordinates,
  to: QuickSearchCoordinates,
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseQuickSearchCoordinates(
  input: string,
): QuickSearchCoordinates | null {
  const coordinateMatch = input.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );

  if (!coordinateMatch) {
    return null;
  }

  const latitude = Number.parseFloat(coordinateMatch[1]);
  const longitude = Number.parseFloat(coordinateMatch[2]);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * The selectable categories, derived entirely from the farm data the backend
 * returned — there is no hardcoded list. If the database is empty (no farms,
 * or farms without categories) this returns `[]`, so no categories are shown.
 * Each entry's `category` is the canonical key (German); translate it for
 * display with `categoryLabel` from `lib/categories`.
 */
export function getQuickSearchProducts(farms: Farm[]): QuickSearchProduct[] {
  const farmCountByCategory = new Map<string, number>();

  for (const farm of farms) {
    const seen = new Set<string>();
    for (const rawCategory of farm.categories) {
      const trimmed = rawCategory.trim();
      if (trimmed.length === 0) {
        continue;
      }
      // Roll granular products up to their parent group so the picker stays at
      // the 13-group level (existing group values map to themselves).
      const category = productGroupOf(trimmed);
      if (seen.has(category)) {
        continue;
      }
      seen.add(category);
      farmCountByCategory.set(
        category,
        (farmCountByCategory.get(category) ?? 0) + 1,
      );
    }
  }

  return [...farmCountByCategory.entries()]
    .map(([category, farmCount]) => ({ category, farmCount }))
    .sort(
      (left, right) =>
        right.farmCount - left.farmCount ||
        left.category.localeCompare(right.category),
    );
}

function getLocationScore(
  farm: Farm,
  normalizedQuery: string,
  queryTokens: string[],
) {
  if (normalizedQuery.length === 0) {
    return 0;
  }

  const haystack = normalizeSearchValue(
    `${farm.address} ${farm.canton} ${getCantonName(farm.canton)}`,
  );

  if (haystack.includes(normalizedQuery)) {
    return 3;
  }

  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => haystack.includes(token))
  ) {
    return 2;
  }

  if (
    queryTokens.some((token) => token.length > 1 && haystack.includes(token))
  ) {
    return 1;
  }

  return 0;
}

export function getQuickSearchResults({
  farms,
  location,
  matchMode,
  selectedProducts,
}: {
  farms: Farm[];
  location: QuickSearchLocation;
  matchMode: QuickSearchMatchMode;
  selectedProducts: string[];
}): QuickSearchResult[] {
  if (selectedProducts.length === 0) {
    return [];
  }

  const normalizedQuery = location.coordinates
    ? ""
    : normalizeSearchValue(location.label);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  const results: QuickSearchResult[] = [];

  for (const farm of farms) {
    const matchedProducts = selectedProducts.filter((product) =>
      farmMatchesProduct(farm, product),
    );

    const matchesSelection =
      matchMode === "all"
        ? matchedProducts.length === selectedProducts.length
        : matchedProducts.length > 0;

    if (!matchesSelection) {
      continue;
    }

    let distanceKm: number | null = null;

    if (location.coordinates) {
      const farmCoordinates = parseQuickSearchCoordinates(farm.coordinates);

      if (farmCoordinates) {
        distanceKm = haversineDistanceKm(location.coordinates, farmCoordinates);
      }
    }

    results.push({
      distanceKm,
      farm,
      locationScore: getLocationScore(farm, normalizedQuery, queryTokens),
      matchedProducts,
    });
  }

  return results.sort((left, right) => {
    if (left.distanceKm !== null && right.distanceKm !== null) {
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }
    } else if (left.distanceKm !== null) {
      return -1;
    } else if (right.distanceKm !== null) {
      return 1;
    }

    if (right.locationScore !== left.locationScore) {
      return right.locationScore - left.locationScore;
    }

    if (right.matchedProducts.length !== left.matchedProducts.length) {
      return right.matchedProducts.length - left.matchedProducts.length;
    }

    return left.farm.name.localeCompare(right.farm.name);
  });
}

export function getNearestFarm(
  farms: Farm[],
  coordinates: QuickSearchCoordinates,
): { farm: Farm; distanceKm: number } | null {
  let nearest: { farm: Farm; distanceKm: number } | null = null;

  for (const farm of farms) {
    const farmCoordinates = parseQuickSearchCoordinates(farm.coordinates);
    if (!farmCoordinates) {
      continue;
    }

    const distanceKm = haversineDistanceKm(coordinates, farmCoordinates);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { farm, distanceKm };
    }
  }

  return nearest;
}

export interface FarmDistance {
  farm: Farm;
  distanceKm: number;
}

/**
 * The `limit` farms closest to `coordinates`, nearest first. Farms without
 * parseable coordinates are skipped. Used by the "near me" sheet.
 */
export function getNearestFarms(
  farms: Farm[],
  coordinates: QuickSearchCoordinates,
  limit = 10,
): FarmDistance[] {
  const withDistance: FarmDistance[] = [];

  for (const farm of farms) {
    const farmCoordinates = parseQuickSearchCoordinates(farm.coordinates);
    if (!farmCoordinates) {
      continue;
    }
    withDistance.push({
      farm,
      distanceKm: haversineDistanceKm(coordinates, farmCoordinates),
    });
  }

  return withDistance
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Math.max(0, limit));
}

export function formatQuickSearchDistance(distanceKm: number | null) {
  if (distanceKm === null) {
    return null;
  }

  if (distanceKm < 1) {
    return "Less than 1 km away";
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
}

// ---------------------------------------------------------------------------
// Last search — lets a returning visitor resume in one tap (and powers the
// "Repeat last search" PWA shortcut). Only products + match mode are stored;
// location stays out of both storage and URLs.

export const LAST_SEARCH_STORAGE_KEY = "farms.lastQuickSearch";

export interface LastQuickSearch {
  matchMode: QuickSearchMatchMode;
  products: string[];
}

export function readLastQuickSearch(): LastQuickSearch | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LAST_SEARCH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const candidate = parsed as Partial<LastQuickSearch>;
    const products = Array.isArray(candidate.products)
      ? candidate.products.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0 && value.length < 80,
        )
      : [];
    if (products.length === 0) {
      return null;
    }
    return {
      matchMode: candidate.matchMode === "any" ? "any" : "all",
      products: products.slice(0, 24),
    };
  } catch {
    return null;
  }
}

export function writeLastQuickSearch(search: LastQuickSearch): void {
  if (typeof window === "undefined" || search.products.length === 0) {
    return;
  }
  try {
    window.localStorage.setItem(
      LAST_SEARCH_STORAGE_KEY,
      JSON.stringify(search),
    );
  } catch {
    // Storage full or disabled — non-fatal.
  }
}
