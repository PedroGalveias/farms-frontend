import { beforeEach, describe, expect, it } from "vitest";
import {
  FARM_CACHE_STORAGE_KEY,
  readCachedFarms,
  writeCachedFarms,
} from "@/lib/offline-farms";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
    name: "Test Farm",
    address: "Main Street 1",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("offline farm cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips cached farms through localStorage", () => {
    const farms = [makeFarm()];
    writeCachedFarms(farms);

    expect(readCachedFarms()).toEqual(farms);
  });

  it("filters invalid farm records", () => {
    window.localStorage.setItem(
      FARM_CACHE_STORAGE_KEY,
      JSON.stringify({ farms: [makeFarm(), { id: "broken" }] }),
    );

    expect(readCachedFarms()).toEqual([makeFarm()]);
  });

  it("returns an empty list for corrupt cache data", () => {
    window.localStorage.setItem(FARM_CACHE_STORAGE_KEY, "{nope");

    expect(readCachedFarms()).toEqual([]);
  });
});
