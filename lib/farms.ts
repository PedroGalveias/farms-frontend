import { productGroupOf } from "@/lib/products";
import type { Farm } from "@/types/farm";

export const SWISS_CANTONS = [
  { code: "AG", name: "Aargau" },
  { code: "AI", name: "Appenzell Innerrhoden" },
  { code: "AR", name: "Appenzell Ausserrhoden" },
  { code: "BE", name: "Bern" },
  { code: "BL", name: "Basel-Landschaft" },
  { code: "BS", name: "Basel-Stadt" },
  { code: "FR", name: "Fribourg" },
  { code: "GE", name: "Geneva" },
  { code: "GL", name: "Glarus" },
  { code: "GR", name: "Graubunden" },
  { code: "JU", name: "Jura" },
  { code: "LU", name: "Lucerne" },
  { code: "NE", name: "Neuchatel" },
  { code: "NW", name: "Nidwalden" },
  { code: "OW", name: "Obwalden" },
  { code: "SG", name: "St. Gallen" },
  { code: "SH", name: "Schaffhausen" },
  { code: "SO", name: "Solothurn" },
  { code: "SZ", name: "Schwyz" },
  { code: "TG", name: "Thurgau" },
  { code: "TI", name: "Ticino" },
  { code: "UR", name: "Uri" },
  { code: "VD", name: "Vaud" },
  { code: "VS", name: "Valais" },
  { code: "ZG", name: "Zug" },
  { code: "ZH", name: "Zurich" },
] as const;

// Switzerland's seven statistical "great regions" (Grossregionen), used to
// group the canton filter for faster scanning. `key` is an i18n message key.
export const SWISS_REGIONS: { key: string; cantons: string[] }[] = [
  { key: "region_leman", cantons: ["GE", "VD", "VS"] },
  { key: "region_mittelland", cantons: ["BE", "FR", "JU", "NE", "SO"] },
  { key: "region_nordwest", cantons: ["AG", "BL", "BS"] },
  { key: "region_zurich", cantons: ["ZH"] },
  { key: "region_ost", cantons: ["AI", "AR", "GL", "GR", "SG", "SH", "TG"] },
  { key: "region_zentral", cantons: ["LU", "NW", "OW", "SZ", "UR", "ZG"] },
  { key: "region_ticino", cantons: ["TI"] },
];

const cantonNameByCode = new Map<string, string>(
  SWISS_CANTONS.map((canton) => [canton.code, canton.name]),
);

/**
 * Buckets the given canton codes into Switzerland's great regions, preserving
 * region order and dropping regions (and codes) that have no farms. Any code
 * not mapped to a region (shouldn't happen for valid Swiss data) is collected
 * under a trailing "region_other" group so nothing is silently hidden.
 */
export function groupCantonsByRegion(cantonCodes: string[]) {
  const available = new Set(cantonCodes);
  const assigned = new Set<string>();

  const groups = SWISS_REGIONS.map((region) => {
    const cantons = region.cantons.filter((code) => available.has(code));
    cantons.forEach((code) => assigned.add(code));
    return { key: region.key, cantons };
  }).filter((region) => region.cantons.length > 0);

  const leftovers = cantonCodes.filter((code) => !assigned.has(code));
  if (leftovers.length > 0) {
    groups.push({ key: "region_other", cantons: leftovers });
  }

  return groups;
}

export function getUniqueFarmCantons(farms: Farm[]) {
  return Array.from(new Set(farms.map((farm) => farm.canton))).sort((a, b) =>
    a.localeCompare(b),
  );
}

// A farm's distinct category groups: granular products are rolled up to their
// parent group (and existing group-level values map to themselves), so the
// directory always works at the 13-group level.
export function getFarmGroups(farm: Farm) {
  return Array.from(new Set(farm.categories.map(productGroupOf)));
}

export function getUniqueFarmCategories(farms: Farm[]) {
  return Array.from(new Set(farms.flatMap(getFarmGroups))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getTopFarmCategories(farms: Farm[], limit = 6) {
  const counts = new Map<string, number>();

  for (const farm of farms) {
    for (const category of getFarmGroups(farm)) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([category]) => category);
}

export function getCantonName(code: string) {
  return cantonNameByCode.get(code.toUpperCase()) ?? code;
}

export function formatFarmDate(value: string) {
  return new Intl.DateTimeFormat("en-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function splitCoordinates(coordinates: string) {
  const [latitude = "", longitude = ""] = coordinates
    .split(",")
    .map((value) => value.trim());

  return { latitude, longitude };
}
