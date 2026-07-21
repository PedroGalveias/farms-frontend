/** Per-(farm, product) availability, mirroring the backend `stock_status` enum. */
export type StockStatus = "AVAILABLE" | "SEASONAL" | "UNAVAILABLE";

/**
 * A product a farm offers, as returned in each farm's `products[]` by the
 * taxonomy-aware backend. Absent on the older backend (which classified farms
 * only at the category-group level), hence optional on {@link Farm}.
 */
export interface FarmProduct {
  /** Stable, URL/API-safe product identity, e.g. "strawberries". */
  slug: string;
  /** English display name; `null` when only the German key is known. */
  name_en: string | null;
  /** Slug of the category group this product belongs to, e.g. "fruits". */
  group: string;
  status: StockStatus;
  /** ISO timestamp the availability was last confirmed, or `null`. */
  last_confirmed_at: string | null;
}

export interface Farm {
  id: string;
  name: string;
  address: string;
  canton: string;
  coordinates: string;
  categories: string[];
  /**
   * Granular products the farm offers. Populated by the taxonomy-aware backend;
   * `undefined` when talking to the older group-only backend.
   */
  products?: FarmProduct[];
  created_at: string;
  updated_at: string | null;
  /** Gallery image URLs — not yet served by the backend (template only). */
  photos?: string[];
}

export interface CreateFarmInput {
  name: string;
  address: string;
  canton: string;
  coordinates: string;
  categories: string[];
}

export interface CreateFarmPayload extends CreateFarmInput {
  idempotency_key: string;
}

export interface FarmFormValues {
  name: string;
  address: string;
  canton: string;
  latitude: string;
  longitude: string;
  categories: string[];
}

export type FarmFormErrors = Partial<Record<keyof FarmFormValues, string>>;
export type DirectoryViewMode = "grid" | "list" | "map";
export type FarmSortOption = "newest" | "name" | "canton" | "nearest";

export type ServiceStatus = "online" | "degraded" | "offline";
