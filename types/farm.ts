export interface Farm {
  id: string;
  name: string;
  address: string;
  canton: string;
  coordinates: string;
  categories: string[];
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
