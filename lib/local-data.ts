import { COLLECTIONS_STORAGE_KEY } from "@/lib/collections";
import { LOCATION_STORAGE_KEY } from "@/lib/geolocation";
import {
  FARM_CACHE_STORAGE_KEY,
  SAVED_FARM_CACHE_STORAGE_KEY,
} from "@/lib/offline-farms";
import {
  FAVORITES_STORAGE_KEY,
  RECENT_STORAGE_KEY,
} from "@/lib/personalization";
import { LAST_SEARCH_STORAGE_KEY } from "@/lib/quick-search";
import { RECENT_SEARCHES_STORAGE_KEY } from "@/lib/recent-searches";
import { SEARCH_STATS_STORAGE_KEY } from "@/lib/search-stats";
import {
  SEASONAL_ACK_STORAGE_KEY,
  SEASONAL_REMINDERS_STORAGE_KEY,
} from "@/lib/seasonal-reminders";
import { TRIP_STORAGE_KEY } from "@/lib/trip";

/** Device-local content reset by Settings → Your data. Preferences stay put. */
export const USER_DATA_STORAGE_KEYS = [
  FAVORITES_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  COLLECTIONS_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  SEARCH_STATS_STORAGE_KEY,
  SEASONAL_REMINDERS_STORAGE_KEY,
  SEASONAL_ACK_STORAGE_KEY,
  LAST_SEARCH_STORAGE_KEY,
  RECENT_SEARCHES_STORAGE_KEY,
  TRIP_STORAGE_KEY,
  FARM_CACHE_STORAGE_KEY,
  SAVED_FARM_CACHE_STORAGE_KEY,
] as const;
