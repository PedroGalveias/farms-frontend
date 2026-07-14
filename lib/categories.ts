import type { Locale } from "@/lib/i18n";

/**
 * Category catalog — the controlled vocabulary of product groups.
 *
 * The backend is the source of truth for *which* categories exist: it stores
 * the canonical **German** group name on each farm (e.g. "Früchte"). Those
 * German strings are the keys here. The frontend owns the *translations* and
 * the icon for each known group, because category names are a small, slow-
 * changing, display-only vocabulary and the app already owns all other UI
 * translations.
 *
 * Keep this in sync with the dataset via `scripts/transform-farms.py`, which
 * validates that every category group present in the farm data has an entry
 * here (and seeds the DB with these exact German keys). When the backend adds
 * a new group, add a row below — until then it falls back to showing the raw
 * German string with a neutral icon, so nothing breaks.
 */
export interface CategoryMeta {
  emoji: string;
  /** Display labels per locale. `de` is the canonical key itself. */
  labels: Record<Locale, string>;
}

export const CATEGORY_CATALOG: Record<string, CategoryMeta> = {
  Früchte: {
    emoji: "🍎",
    labels: {
      de: "Früchte",
      en: "Fruits",
      fr: "Fruits",
      it: "Frutta",
      rm: "Fritgs",
    },
  },
  Gemüse: {
    emoji: "🥕",
    labels: {
      de: "Gemüse",
      en: "Vegetables",
      fr: "Légumes",
      it: "Verdura",
      rm: "Verduras",
    },
  },
  Milchprodukte: {
    emoji: "🥛",
    labels: {
      de: "Milchprodukte",
      en: "Dairy",
      fr: "Produits laitiers",
      it: "Latticini",
      rm: "Products da latg",
    },
  },
  "Fleisch und Geflügel": {
    emoji: "🥩",
    labels: {
      de: "Fleisch und Geflügel",
      en: "Meat & poultry",
      fr: "Viande et volaille",
      it: "Carne e pollame",
      rm: "Charn e pulam",
    },
  },
  "Verarbeitete und haltbare Produkte": {
    emoji: "🫙",
    labels: {
      de: "Verarbeitete und haltbare Produkte",
      en: "Preserves & processed",
      fr: "Produits transformés et conserves",
      it: "Prodotti trasformati e conserve",
      rm: "Products transformads e conservads",
    },
  },
  "Honig und Süßstoffe": {
    emoji: "🍯",
    labels: {
      de: "Honig und Süßstoffe",
      en: "Honey & sweeteners",
      fr: "Miel et édulcorants",
      it: "Miele e dolcificanti",
      rm: "Mel e dultschadiras",
    },
  },
  Getränke: {
    emoji: "🥤",
    labels: {
      de: "Getränke",
      en: "Drinks",
      fr: "Boissons",
      it: "Bevande",
      rm: "Bavrondas",
    },
  },
  "Backwaren und Gebäck": {
    emoji: "🥐",
    labels: {
      de: "Backwaren und Gebäck",
      en: "Bakery",
      fr: "Boulangerie",
      it: "Prodotti da forno",
      rm: "Ar da furnaria",
    },
  },
  "Blumen und Pflanzen": {
    emoji: "🌷",
    labels: {
      de: "Blumen und Pflanzen",
      en: "Flowers & plants",
      fr: "Fleurs et plantes",
      it: "Fiori e piante",
      rm: "Flurs e plantas",
    },
  },
  "Nüsse, Samen und Öle": {
    emoji: "🌰",
    labels: {
      de: "Nüsse, Samen und Öle",
      en: "Nuts, seeds & oils",
      fr: "Noix, graines et huiles",
      it: "Noci, semi e oli",
      rm: "Nuschs, sems ed ieli",
    },
  },
  "Getreide und Cerealien": {
    emoji: "🌾",
    labels: {
      de: "Getreide und Cerealien",
      en: "Grains & cereals",
      fr: "Céréales",
      it: "Cereali",
      rm: "Cereals",
    },
  },
  "Fisch und Meeresfrüchte": {
    emoji: "🐟",
    labels: {
      de: "Fisch und Meeresfrüchte",
      en: "Fish & seafood",
      fr: "Poisson et fruits de mer",
      it: "Pesce e frutti di mare",
      rm: "Pesch e fritgs da mar",
    },
  },
  Sonstiges: {
    emoji: "🧺",
    labels: {
      de: "Sonstiges",
      en: "Other",
      fr: "Autres",
      it: "Altro",
      rm: "Auter",
    },
  },
};

const DEFAULT_CATEGORY_EMOJI = "🧺";

/** Canonical German keys of the known categories. */
export const KNOWN_CATEGORY_KEYS = Object.keys(CATEGORY_CATALOG);

/**
 * German is the canonical category language, but the live data contains
 * variant group names (older imports, hand-entered farms) that the catalog
 * doesn't know — they'd render as raw German among translated labels and
 * split the counts ("Früchte und Obst" 120 next to "Fruits" 789). Map each
 * known variant to its canonical key at the data boundary; genuinely new
 * groups still fall through raw (visible = noticed = added here or seeded
 * properly in the backend).
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  Backwaren: "Backwaren und Gebäck",
  Blumen: "Blumen und Pflanzen",
  Fisch: "Fisch und Meeresfrüchte",
  Fleisch: "Fleisch und Geflügel",
  "Früchte und Obst": "Früchte",
  Geflügel: "Fleisch und Geflügel",
  Gebäck: "Backwaren und Gebäck",
  Getreide: "Getreide und Cerealien",
  Honig: "Honig und Süßstoffe",
  Obst: "Früchte",
  Sonstige: "Sonstiges",
};

/** Canonical catalog key for a raw category string (trim + alias lookup). */
export function canonicalCategory(value: string): string {
  const trimmed = value.trim();
  return CATEGORY_ALIASES[trimmed] ?? trimmed;
}

/** A farm's categories, canonicalised and de-duplicated. */
export function normalizeFarmCategories(categories: string[]): string[] {
  return [...new Set(categories.map(canonicalCategory))];
}

/**
 * Localized display label for a category. Falls back to English, then to the
 * raw key (the German string the backend sent) so an unmapped category still
 * renders sensibly instead of breaking.
 */
export function categoryLabel(key: string, locale: Locale): string {
  const meta = CATEGORY_CATALOG[key];
  if (!meta) {
    return key;
  }
  return meta.labels[locale] ?? meta.labels.en ?? key;
}

/** Icon for a category, with a neutral fallback for unmapped categories. */
export function categoryEmoji(key: string): string {
  return CATEGORY_CATALOG[key]?.emoji ?? DEFAULT_CATEGORY_EMOJI;
}
