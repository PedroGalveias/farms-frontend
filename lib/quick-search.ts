import type { Farm } from "@/types/farm";

const CURATED_PRODUCTS = [
  "Milk",
  "Cheese",
  "Ham",
  "Honey",
  "Fruits",
  "Fruit juice",
  "Eggs",
  "Vegetables",
  "Bread",
  "Jam",
  "Meat",
  "Organic",
] as const;

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\beggs\b/g, "egg")
    .replace(/\bfruits\b/g, "fruit")
    .replace(/\bvegetables\b/g, "vegetable")
    .replace(/\bjuices\b/g, "juice")
    .trim();
}

function categoriesMatch(leftValue: string, rightValue: string) {
  const left = normalizeSearchValue(leftValue);
  const right = normalizeSearchValue(rightValue);

  return left.includes(right) || right.includes(left);
}

function haversineDistanceKm(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstPointLatitude = toRadians(firstLatitude);
  const secondPointLatitude = toRadians(secondLatitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(firstPointLatitude) *
      Math.cos(secondPointLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export interface QuickSearchLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  label: string;
}

export interface QuickSearchResult {
  distanceKm: number | null;
  farm: Farm;
  locationScore: number;
  matchedProducts: string[];
}

export function parseQuickSearchCoordinates(input: string) {
  const coordinateMatch =
    input.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );

  if (!coordinateMatch) {
    return null;
  }

  return {
    latitude: Number.parseFloat(coordinateMatch[1]),
    longitude: Number.parseFloat(coordinateMatch[2]),
  };
}

export function getQuickSearchProducts(farms: Farm[]) {
  const products = new Map<string, string>();

  for (const product of CURATED_PRODUCTS) {
    products.set(normalizeSearchValue(product), product);
  }

  for (const farm of farms) {
    for (const category of farm.categories) {
      const normalized = normalizeSearchValue(category);

      if (!products.has(normalized)) {
        products.set(normalized, category);
      }
    }
  }

  return [...products.values()];
}

export function getQuickSearchResults({
  farms,
  location,
  selectedProducts,
}: {
  farms: Farm[];
  location: QuickSearchLocation;
  selectedProducts: string[];
}) {
  const typedLocation = location.label.trim();
  const typedLocationNormalized = normalizeSearchValue(typedLocation);

  const results = farms
    .map((farm) => {
      const matchedProducts = selectedProducts.filter((product) =>
        farm.categories.some((category) => categoriesMatch(product, category)),
      );

      if (matchedProducts.length !== selectedProducts.length) {
        return null;
      }

      let distanceKm: number | null = null;
      if (location.coordinates) {
        const coordinates = parseQuickSearchCoordinates(farm.coordinates);

        if (coordinates) {
          distanceKm = haversineDistanceKm(
            location.coordinates.latitude,
            location.coordinates.longitude,
            coordinates.latitude,
            coordinates.longitude,
          );
        }
      }

      let locationScore = 0;
      if (typedLocationNormalized.length > 0 && !location.coordinates) {
        const searchableFarmLocation = normalizeSearchValue(
          `${farm.address} ${farm.canton}`,
        );

        if (searchableFarmLocation.includes(typedLocationNormalized)) {
          locationScore = 3;
        } else if (
          farm.canton.toLowerCase() === typedLocation.trim().toLowerCase()
        ) {
          locationScore = 2;
        }
      }

      return {
        distanceKm,
        farm,
        locationScore,
        matchedProducts,
      } satisfies QuickSearchResult;
    })
    .filter((result): result is QuickSearchResult => result !== null);

  return results.sort((leftResult, rightResult) => {
    if (location.coordinates && leftResult.distanceKm !== null && rightResult.distanceKm !== null) {
      return leftResult.distanceKm - rightResult.distanceKm;
    }

    if (!location.coordinates && typedLocationNormalized.length > 0) {
      if (rightResult.locationScore !== leftResult.locationScore) {
        return rightResult.locationScore - leftResult.locationScore;
      }
    }

    return leftResult.farm.name.localeCompare(rightResult.farm.name);
  });
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
