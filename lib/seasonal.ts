import type { Locale } from "@/lib/i18n";

/**
 * Swiss seasonal produce catalog. Each item has an emoji and a label in every
 * locale; `SEASONAL_BY_MONTH` lists the produce keys typically in season per
 * month (index 0 = January). Romansh is best-effort. Falls back to English
 * for any unmapped item.
 */
interface Produce {
  emoji: string;
  labels: Record<Locale, string>;
}

const P = (
  emoji: string,
  en: string,
  de: string,
  fr: string,
  it: string,
  rm: string,
): Produce => ({ emoji, labels: { en, de, fr, it, rm } });

export const SEASONAL_PRODUCE: Record<string, Produce> = {
  apples: P("🍎", "Apples", "Äpfel", "Pommes", "Mele", "Mailas"),
  pears: P("🍐", "Pears", "Birnen", "Poires", "Pere", "Piras"),
  cabbage: P("🥬", "Cabbage", "Kohl", "Chou", "Cavolo", "Chaul"),
  carrots: P("🥕", "Carrots", "Karotten", "Carottes", "Carote", "Carotas"),
  onions: P("🧅", "Onions", "Zwiebeln", "Oignons", "Cipolle", "Tschiollas"),
  potatoes: P(
    "🥔",
    "Potatoes",
    "Kartoffeln",
    "Pommes de terre",
    "Patate",
    "Tartuffels",
  ),
  lambsLettuce: P(
    "🥬",
    "Lamb's lettuce",
    "Nüsslisalat",
    "Mâche",
    "Songino",
    "Salata da nusch",
  ),
  spinach: P("🥬", "Spinach", "Spinat", "Épinards", "Spinaci", "Spinat"),
  lettuce: P("🥗", "Lettuce", "Salat", "Laitue", "Lattuga", "Salata"),
  chives: P(
    "🌿",
    "Chives",
    "Schnittlauch",
    "Ciboulette",
    "Erba cipollina",
    "Tschiollas verdas",
  ),
  asparagus: P(
    "🥬",
    "Asparagus",
    "Spargeln",
    "Asperges",
    "Asparagi",
    "Spargels",
  ),
  radishes: P(
    "🌶️",
    "Radishes",
    "Radieschen",
    "Radis",
    "Ravanelli",
    "Ravanellas",
  ),
  rhubarb: P("🌿", "Rhubarb", "Rhabarber", "Rhubarbe", "Rabarbaro", "Rabarber"),
  strawberries: P(
    "🍓",
    "Strawberries",
    "Erdbeeren",
    "Fraises",
    "Fragole",
    "Fraglas",
  ),
  peas: P("🫛", "Peas", "Erbsen", "Petits pois", "Piselli", "Arbeis"),
  cherries: P(
    "🍒",
    "Cherries",
    "Kirschen",
    "Cerises",
    "Ciliegie",
    "Tschireschas",
  ),
  cucumbers: P(
    "🥒",
    "Cucumbers",
    "Gurken",
    "Concombres",
    "Cetrioli",
    "Cucumers",
  ),
  apricots: P(
    "🍑",
    "Apricots",
    "Aprikosen",
    "Abricots",
    "Albicocche",
    "Albicocs",
  ),
  berries: P("🫐", "Berries", "Beeren", "Baies", "Bacche", "Bachas"),
  tomatoes: P("🍅", "Tomatoes", "Tomaten", "Tomates", "Pomodori", "Tomatas"),
  peppers: P("🫑", "Peppers", "Peperoni", "Poivrons", "Peperoni", "Peperoni"),
  peaches: P("🍑", "Peaches", "Pfirsiche", "Pêches", "Pesche", "Persics"),
  plums: P("🫐", "Plums", "Pflaumen", "Prunes", "Prugne", "Pruns"),
  corn: P("🌽", "Corn", "Mais", "Maïs", "Mais", "Mais"),
  beans: P("🫛", "Beans", "Bohnen", "Haricots", "Fagioli", "Fasoriginals"),
  grapes: P("🍇", "Grapes", "Trauben", "Raisins", "Uva", "Iva"),
  pumpkins: P("🎃", "Pumpkins", "Kürbis", "Courges", "Zucche", "Cucurbitas"),
  mushrooms: P("🍄", "Mushrooms", "Pilze", "Champignons", "Funghi", "Bulais"),
};

// Produce keys in season per month (index 0 = January), Switzerland.
export const SEASONAL_BY_MONTH: string[][] = [
  ["apples", "pears", "cabbage", "carrots", "onions", "potatoes"],
  ["apples", "cabbage", "carrots", "onions", "potatoes", "lambsLettuce"],
  ["carrots", "spinach", "lettuce", "apples", "chives", "lambsLettuce"],
  ["asparagus", "lettuce", "spinach", "radishes", "rhubarb", "carrots"],
  ["strawberries", "asparagus", "lettuce", "rhubarb", "peas", "radishes"],
  ["strawberries", "cherries", "cucumbers", "lettuce", "peas", "apricots"],
  ["cherries", "apricots", "berries", "tomatoes", "cucumbers", "peppers"],
  ["peaches", "plums", "tomatoes", "corn", "peppers", "beans"],
  ["grapes", "apples", "pears", "pumpkins", "tomatoes", "corn"],
  ["apples", "pears", "grapes", "pumpkins", "cabbage", "mushrooms"],
  ["apples", "pears", "pumpkins", "cabbage", "carrots", "potatoes"],
  ["apples", "pears", "cabbage", "carrots", "potatoes", "lambsLettuce"],
];

// Each seasonal item's parent category group (all are fruits or vegetables),
// using the canonical German group keys from lib/categories so the value can
// drive the quick-search filter.
const PRODUCE_GROUP: Record<string, string> = {
  apples: "Früchte",
  pears: "Früchte",
  strawberries: "Früchte",
  cherries: "Früchte",
  apricots: "Früchte",
  berries: "Früchte",
  plums: "Früchte",
  peaches: "Früchte",
  grapes: "Früchte",
  cabbage: "Gemüse",
  carrots: "Gemüse",
  onions: "Gemüse",
  potatoes: "Gemüse",
  lambsLettuce: "Gemüse",
  spinach: "Gemüse",
  lettuce: "Gemüse",
  chives: "Gemüse",
  asparagus: "Gemüse",
  radishes: "Gemüse",
  rhubarb: "Gemüse",
  peas: "Gemüse",
  cucumbers: "Gemüse",
  tomatoes: "Gemüse",
  peppers: "Gemüse",
  corn: "Gemüse",
  beans: "Gemüse",
  pumpkins: "Gemüse",
  mushrooms: "Gemüse",
};

/** The distinct category groups in season for a month (index 0 = January). */
export function seasonalGroupsForMonth(monthIndex: number): string[] {
  const items = SEASONAL_BY_MONTH[monthIndex] ?? [];
  return Array.from(
    new Set(items.map((key) => PRODUCE_GROUP[key]).filter(Boolean)),
  );
}

export function produceEmoji(key: string): string {
  return SEASONAL_PRODUCE[key]?.emoji ?? "🧺";
}

export function produceLabel(key: string, locale: Locale): string {
  const item = SEASONAL_PRODUCE[key];
  if (!item) {
    return key;
  }
  return item.labels[locale] ?? item.labels.en ?? key;
}
