import { PRODUCTS } from "@/lib/products";
import type { Locale } from "@/lib/i18n";

/**
 * Swiss seasonal produce — transcribed from the official Swiss Farmers
 * "Seasonal calendar" (swiss-farmers.ch/seasonal-calendar). For each item we
 * record the months it is *harvested* locally (the filled dots on that chart;
 * the hollow "available in the shop" months from storage are intentionally
 * excluded, since "in season" means actively growing/harvested here).
 *
 * `months` are 1-based (1 = January … 12 = December). `group` is the canonical
 * German category group (lib/categories) so the value can drive the directory /
 * quick-search filters. Romansh labels are best-effort. SEASONAL_BY_MONTH and
 * the group lookup are derived from this single table.
 */
export interface Produce {
  emoji: string;
  group: string;
  months: number[];
  labels: Record<Locale, string>;
}

const P = (
  emoji: string,
  group: string,
  months: number[],
  en: string,
  de: string,
  fr: string,
  it: string,
  rm: string,
): Produce => ({ emoji, group, months, labels: { en, de, fr, it, rm } });

const FRUIT = "Früchte";
const VEG = "Gemüse";

export const SEASONAL_PRODUCE: Record<string, Produce> = {
  // ---- Fruit (Früchte) ----
  strawberries: P(
    "🍓",
    FRUIT,
    [5, 6, 7],
    "Strawberries",
    "Erdbeeren",
    "Fraises",
    "Fragole",
    "Fraglas",
  ),
  cherries: P(
    "🍒",
    FRUIT,
    [6, 7, 8],
    "Cherries",
    "Kirschen",
    "Cerises",
    "Ciliegie",
    "Tschireschas",
  ),
  apricots: P(
    "🍑",
    FRUIT,
    [7, 8],
    "Apricots",
    "Aprikosen",
    "Abricots",
    "Albicocche",
    "Albicocs",
  ),
  peaches: P(
    "🍑",
    FRUIT,
    [7, 8],
    "Peaches",
    "Pfirsiche",
    "Pêches",
    "Pesche",
    "Persics",
  ),
  nectarines: P(
    "🍑",
    FRUIT,
    [7, 8],
    "Nectarines",
    "Nektarinen",
    "Nectarines",
    "Nettarine",
    "Nectarinas",
  ),
  plums: P(
    "🫐",
    FRUIT,
    [7, 8, 9],
    "Plums",
    "Pflaumen",
    "Prunes",
    "Prugne",
    "Pruns",
  ),
  mirabelles: P(
    "🫐",
    FRUIT,
    [8, 9],
    "Mirabelles",
    "Mirabellen",
    "Mirabelles",
    "Mirabelle",
    "Mirabellas",
  ),
  raspberries: P(
    "🫐",
    FRUIT,
    [6, 7, 8, 9],
    "Raspberries",
    "Himbeeren",
    "Framboises",
    "Lamponi",
    "Frambostgas",
  ),
  blackberries: P(
    "🫐",
    FRUIT,
    [7, 8, 9],
    "Blackberries",
    "Brombeeren",
    "Mûres",
    "More",
    "Moras",
  ),
  blueberries: P(
    "🫐",
    FRUIT,
    [7, 8, 9],
    "Blueberries",
    "Heidelbeeren",
    "Myrtilles",
    "Mirtilli",
    "Mirtils",
  ),
  redcurrants: P(
    "🫐",
    FRUIT,
    [6, 7, 8],
    "Currants",
    "Johannisbeeren",
    "Groseilles",
    "Ribes",
    "Ribes",
  ),
  gooseberries: P(
    "🫐",
    FRUIT,
    [6, 7, 8],
    "Gooseberries",
    "Stachelbeeren",
    "Groseilles à maquereau",
    "Uva spina",
    "Üvas spinusas",
  ),
  grapes: P("🍇", FRUIT, [9, 10], "Grapes", "Trauben", "Raisins", "Uva", "Iva"),
  apples: P(
    "🍎",
    FRUIT,
    [8, 9, 10],
    "Apples",
    "Äpfel",
    "Pommes",
    "Mele",
    "Mailas",
  ),
  pears: P(
    "🍐",
    FRUIT,
    [8, 9, 10],
    "Pears",
    "Birnen",
    "Poires",
    "Pere",
    "Piras",
  ),
  quinces: P(
    "🍐",
    FRUIT,
    [9, 10, 11],
    "Quinces",
    "Quitten",
    "Coings",
    "Mele cotogne",
    "Cudugns",
  ),
  kiwis: P(
    "🥝",
    FRUIT,
    [10, 11, 12],
    "Kiwis",
    "Kiwis",
    "Kiwis",
    "Kiwi",
    "Kiwis",
  ),

  // ---- Vegetables (Gemüse) ----
  asparagus: P(
    "🌱",
    VEG,
    [4, 5, 6],
    "Asparagus",
    "Spargeln",
    "Asperges",
    "Asparagi",
    "Spargels",
  ),
  rhubarb: P(
    "🌿",
    VEG,
    [4, 5, 6],
    "Rhubarb",
    "Rhabarber",
    "Rhubarbe",
    "Rabarbaro",
    "Rabarber",
  ),
  radishes: P(
    "🔴",
    VEG,
    [4, 5, 6, 7, 8, 9, 10],
    "Radishes",
    "Radieschen",
    "Radis",
    "Ravanelli",
    "Ravanellas",
  ),
  spinach: P(
    "🥬",
    VEG,
    [3, 4, 5, 6, 7, 8, 9, 10],
    "Spinach",
    "Spinat",
    "Épinards",
    "Spinaci",
    "Spinat",
  ),
  lettuce: P(
    "🥬",
    VEG,
    [5, 6, 7, 8, 9, 10],
    "Lettuce",
    "Salat",
    "Laitue",
    "Lattuga",
    "Salata",
  ),
  rocket: P(
    "🥬",
    VEG,
    [5, 6, 7, 8, 9, 10],
    "Rocket",
    "Rucola",
    "Roquette",
    "Rucola",
    "Rucola",
  ),
  peas: P(
    "🫛",
    VEG,
    [6, 7],
    "Peas",
    "Erbsen",
    "Petits pois",
    "Piselli",
    "Arbeis",
  ),
  sugarPeas: P(
    "🫛",
    VEG,
    [6, 7, 8],
    "Sugar peas",
    "Zuckererbsen",
    "Pois mange-tout",
    "Taccole",
    "Arbeis-zucher",
  ),
  beans: P(
    "🫛",
    VEG,
    [7, 8, 9, 10],
    "Beans",
    "Bohnen",
    "Haricots",
    "Fagioli",
    "Fagiouls",
  ),
  cucumbers: P(
    "🥒",
    VEG,
    [6, 7, 8, 9, 10],
    "Cucumbers",
    "Gurken",
    "Concombres",
    "Cetrioli",
    "Cucumers",
  ),
  courgettes: P(
    "🥒",
    VEG,
    [6, 7, 8, 9, 10],
    "Courgettes",
    "Zucchini",
    "Courgettes",
    "Zucchine",
    "Zucchini",
  ),
  tomatoes: P(
    "🍅",
    VEG,
    [6, 7, 8, 9, 10],
    "Tomatoes",
    "Tomaten",
    "Tomates",
    "Pomodori",
    "Tomatas",
  ),
  peppers: P(
    "🫑",
    VEG,
    [7, 8, 9, 10],
    "Bell peppers",
    "Peperoni",
    "Poivrons",
    "Peperoni",
    "Peperoni",
  ),
  eggplants: P(
    "🍆",
    VEG,
    [7, 8, 9, 10],
    "Aubergines",
    "Auberginen",
    "Aubergines",
    "Melanzane",
    "Auberginas",
  ),
  sweetcorn: P(
    "🌽",
    VEG,
    [8, 9, 10],
    "Sweet corn",
    "Zuckermais",
    "Maïs",
    "Mais",
    "Mais",
  ),
  fennel: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10],
    "Fennel",
    "Fenchel",
    "Fenouil",
    "Finocchio",
    "Fenadi",
  ),
  broccoli: P(
    "🥦",
    VEG,
    [6, 7, 8, 9, 10],
    "Broccoli",
    "Broccoli",
    "Brocolis",
    "Broccoli",
    "Broccoli",
  ),
  cauliflower: P(
    "🥦",
    VEG,
    [5, 6, 7, 8, 9, 10],
    "Cauliflower",
    "Blumenkohl",
    "Chou-fleur",
    "Cavolfiore",
    "Chaulflur",
  ),
  carrots: P(
    "🥕",
    VEG,
    [6, 7, 8, 9, 10, 11],
    "Carrots",
    "Karotten",
    "Carottes",
    "Carote",
    "Carotas",
  ),
  beetroot: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10],
    "Beetroot",
    "Randen",
    "Betteraves",
    "Barbabietole",
    "Barbabietolas",
  ),
  kohlrabi: P(
    "🥬",
    VEG,
    [5, 6, 7, 8, 9, 10],
    "Kohlrabi",
    "Kohlrabi",
    "Chou-rave",
    "Cavolo rapa",
    "Cularaba",
  ),
  chard: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10],
    "Swiss chard",
    "Mangold",
    "Bettes",
    "Bietola",
    "Mangold",
  ),
  potatoes: P(
    "🥔",
    VEG,
    [6, 7, 8, 9, 10],
    "Potatoes",
    "Kartoffeln",
    "Pommes de terre",
    "Patate",
    "Tartuffels",
  ),
  onions: P(
    "🧅",
    VEG,
    [7, 8, 9],
    "Onions",
    "Zwiebeln",
    "Oignons",
    "Cipolle",
    "Tschiollas",
  ),
  garlic: P("🧄", VEG, [7, 8], "Garlic", "Knoblauch", "Ail", "Aglio", "Agl"),
  pumpkins: P(
    "🎃",
    VEG,
    [8, 9, 10, 11],
    "Pumpkins",
    "Kürbis",
    "Courges",
    "Zucche",
    "Cucurbitas",
  ),
  whiteCabbage: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10, 11],
    "White cabbage",
    "Weisskohl",
    "Chou blanc",
    "Cavolo bianco",
    "Chaul alv",
  ),
  redCabbage: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10, 11],
    "Red cabbage",
    "Rotkohl",
    "Chou rouge",
    "Cavolo rosso",
    "Chaul cotschen",
  ),
  savoyCabbage: P(
    "🥬",
    VEG,
    [1, 2, 6, 7, 8, 9, 10, 11, 12],
    "Savoy cabbage",
    "Wirz",
    "Chou de Milan",
    "Verza",
    "Chaul da Milaun",
  ),
  chineseCabbage: P(
    "🥬",
    VEG,
    [9, 10, 11],
    "Chinese cabbage",
    "Chinakohl",
    "Chou chinois",
    "Cavolo cinese",
    "Chaul chinais",
  ),
  leek: P(
    "🧅",
    VEG,
    [1, 2, 3, 4, 9, 10, 11, 12],
    "Leek",
    "Lauch",
    "Poireau",
    "Porro",
    "Lauch",
  ),
  celeriac: P(
    "🥬",
    VEG,
    [6, 7, 8, 9, 10],
    "Celeriac",
    "Knollensellerie",
    "Céleri-rave",
    "Sedano rapa",
    "Seller",
  ),
  lambsLettuce: P(
    "🥬",
    VEG,
    [1, 2, 3, 9, 10, 11, 12],
    "Lamb's lettuce",
    "Nüsslisalat",
    "Mâche",
    "Songino",
    "Salata da nusch",
  ),
  kale: P(
    "🥬",
    VEG,
    [1, 2, 10, 11, 12],
    "Kale",
    "Grünkohl",
    "Chou frisé",
    "Cavolo riccio",
    "Chaul vert",
  ),
  brusselsSprouts: P(
    "🥬",
    VEG,
    [1, 2, 9, 10, 11, 12],
    "Brussels sprouts",
    "Rosenkohl",
    "Choux de Bruxelles",
    "Cavolini di Bruxelles",
    "Chabuns da Brüssel",
  ),
  parsnips: P(
    "🥬",
    VEG,
    [1, 2, 3, 9, 10, 11, 12],
    "Parsnips",
    "Pastinaken",
    "Panais",
    "Pastinaca",
    "Pastinacas",
  ),
};

/** Produce keys in season (harvested) per month — derived (index 0 = January). */
export const SEASONAL_BY_MONTH: string[][] = Array.from(
  { length: 12 },
  (_, monthIndex) =>
    Object.entries(SEASONAL_PRODUCE)
      .filter(([, produce]) => produce.months.includes(monthIndex + 1))
      .map(([key]) => key),
);

const PRODUCE_GROUP: Record<string, string> = Object.fromEntries(
  Object.entries(SEASONAL_PRODUCE).map(([key, produce]) => [
    key,
    produce.group,
  ]),
);

/** The distinct category groups in season for a month (index 0 = January). */
export function seasonalGroupsForMonth(monthIndex: number): string[] {
  const items = SEASONAL_BY_MONTH[monthIndex] ?? [];
  return Array.from(
    new Set(items.map((key) => PRODUCE_GROUP[key]).filter(Boolean)),
  );
}

/**
 * The specific quick-search keys in season for a month: each item's canonical
 * product key (its German name, when it exists in the product taxonomy) so
 * "find these near you" pre-selects the actual products, falling back to the
 * parent group for anything without a product entry. (index 0 = January)
 */
export function seasonalProductsForMonth(monthIndex: number): string[] {
  return produceToQuickSearchKeys(SEASONAL_BY_MONTH[monthIndex] ?? []);
}

/**
 * Map produce keys to the quick-search keys that select them: each item's
 * canonical product key (its German name, when present in the product taxonomy)
 * or the parent group as a fallback. De-duplicated.
 */
export function produceToQuickSearchKeys(produceKeys: string[]): string[] {
  const keys = produceKeys
    .filter((key) => key in SEASONAL_PRODUCE)
    .map((key) => {
      const germanName = SEASONAL_PRODUCE[key].labels.de;
      return germanName in PRODUCTS ? germanName : PRODUCE_GROUP[key];
    });
  return Array.from(new Set(keys));
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
