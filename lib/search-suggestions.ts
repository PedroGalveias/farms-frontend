import { fuzzyScore } from "@/lib/command";

export type SuggestionType = "farm" | "category" | "canton";

export interface Suggestion {
  type: SuggestionType;
  /** farm id, category value, or canton code — how the consumer acts on it. */
  id: string;
  label: string;
  /** Secondary line (e.g. a farm's canton). */
  sublabel?: string;
}

export interface SuggestionSources {
  farms: { id: string; name: string; address: string; canton: string }[];
  categories: { value: string; label: string }[];
  cantons: { code: string; name: string }[];
}

const MAX_FARMS = 5;
const MAX_CATEGORIES = 3;
const MAX_CANTONS = 2;

function topMatches<T>(
  query: string,
  items: T[],
  text: (item: T) => string,
  limit: number,
): T[] {
  const scored: { item: T; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const score = fuzzyScore(query, text(item));
    if (score !== null) scored.push({ item, score, order });
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.slice(0, limit).map((entry) => entry.item);
}

/**
 * Ranked directory-search suggestions across farms, product categories and
 * cantons — the autocomplete for the directory search box. Farms match on name
 * or address; categories and cantons on their (already localised) labels.
 * Returns farms first, then categories, then cantons.
 */
export function buildSuggestions(
  rawQuery: string,
  sources: SuggestionSources,
): Suggestion[] {
  const query = rawQuery.trim();
  if (query.length < 1) return [];

  const farms = topMatches(
    query,
    sources.farms,
    (farm) => `${farm.name} ${farm.address}`,
    MAX_FARMS,
  ).map<Suggestion>((farm) => ({
    type: "farm",
    id: farm.id,
    label: farm.name,
    sublabel: farm.canton,
  }));

  const categories = topMatches(
    query,
    sources.categories,
    (category) => category.label,
    MAX_CATEGORIES,
  ).map<Suggestion>((category) => ({
    type: "category",
    id: category.value,
    label: category.label,
  }));

  const cantons = topMatches(
    query,
    sources.cantons,
    (canton) => canton.name,
    MAX_CANTONS,
  ).map<Suggestion>((canton) => ({
    type: "canton",
    id: canton.code,
    label: canton.name,
  }));

  return [...farms, ...categories, ...cantons];
}
