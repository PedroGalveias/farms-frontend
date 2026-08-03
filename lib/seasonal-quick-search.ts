import { PRODUCTS } from "@/lib/products";
import {
  PRODUCE_GROUP,
  SEASONAL_BY_MONTH,
  SEASONAL_PRODUCE,
} from "@/lib/seasonal";

/**
 * Seasonal produce keys → quick-search product keys.
 *
 * Kept out of `lib/seasonal` deliberately. It is the only thing there that
 * needs `lib/products` — the 183-product catalogue — and `lib/seasonal` is
 * reached from `lib/seasonal-reminders`, which the reminder provider imports
 * in the root layout. That one edge put the whole catalogue in the JavaScript
 * shared by every route, including pages with no notion of a product at all.
 *
 * Only the seasonal reminder nudge calls this, and only when a reminder is
 * actually due, so it now loads with that nudge instead of with the app.
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

/**
 * The specific quick-search keys in season for a month: each item's canonical
 * product key (its German name, when it exists in the product taxonomy) so
 * "find these near you" pre-selects the actual products, falling back to the
 * parent group for anything without a product entry. (index 0 = January)
 */
export function seasonalProductsForMonth(monthIndex: number): string[] {
  return produceToQuickSearchKeys(SEASONAL_BY_MONTH[monthIndex] ?? []);
}
