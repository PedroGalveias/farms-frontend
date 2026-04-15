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

const cantonNameByCode = new Map<string, string>(
  SWISS_CANTONS.map((canton) => [canton.code, canton.name]),
);

export function getUniqueFarmCantons(farms: Farm[]) {
  return Array.from(new Set(farms.map((farm) => farm.canton))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getUniqueFarmCategories(farms: Farm[]) {
  return Array.from(new Set(farms.flatMap((farm) => farm.categories))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function getTopFarmCategories(farms: Farm[], limit = 6) {
  const counts = new Map<string, number>();

  for (const farm of farms) {
    for (const category of farm.categories) {
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
