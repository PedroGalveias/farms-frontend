import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import {
  useFarmDirectory,
  PAGE_SIZE,
} from "@/components/home/useFarmDirectory";
import {
  DEFAULT_DIRECTORY_PARAMS,
  type DirectoryParams,
} from "@/lib/directory-params";
import { LOCATION_STORAGE_KEY } from "@/lib/geolocation";
import { SEARCH_STATS_STORAGE_KEY } from "@/lib/search-stats";
import type { Farm } from "@/types/farm";

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function farm(overrides: Partial<Farm> & Pick<Farm, "id">): Farm {
  return {
    name: `Farm ${overrides.id}`,
    address: "Dorfstrasse 1",
    canton: "BE",
    coordinates: "46.95,7.45",
    categories: ["Gemüse"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

// A spread of cantons + names to exercise filtering and counts.
const FARMS: Farm[] = [
  farm({ id: "1", name: "Hof Meier", canton: "BE" }),
  farm({ id: "2", name: "Hof Müller", canton: "BE" }),
  farm({ id: "3", name: "Bauernhof Rossi", canton: "ZH" }),
  farm({ id: "4", name: "Ferme Dubois", canton: "VD" }),
];

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

// Mount the hook and flush the on-mount URL/location hydration microtask, so
// later state changes aren't clobbered by hydration resetting to defaults.
async function setup(
  farms = FARMS,
  // Filters now reach the hook the way the server supplies them — parsed from
  // the query string and passed in — rather than being read from
  // window.location at mount.
  initialParams?: Partial<DirectoryParams>,
) {
  const params = initialParams
    ? { ...DEFAULT_DIRECTORY_PARAMS, ...initialParams }
    : undefined;
  const view = renderHook(() => useFarmDirectory(farms, params), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  Reflect.deleteProperty(navigator, "geolocation");
  router.refresh.mockClear();
});

describe("useFarmDirectory", () => {
  it("starts with every farm visible and no active filters", async () => {
    const { result } = await setup();
    expect(result.current.visibleFarms).toHaveLength(4);
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it("filters by canton and reflects it in the active-filter count", async () => {
    const { result } = await setup();
    act(() => result.current.setSelectedCanton("BE"));
    expect(result.current.visibleFarms.map((f) => f.id)).toEqual(["1", "2"]);
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it("filters by search term across the farm name", async () => {
    const { result } = await setup();
    act(() => result.current.setSearchTerm("rossi"));
    await waitFor(() =>
      expect(result.current.visibleFarms.map((f) => f.id)).toEqual(["3"]),
    );
  });

  it("computes contextual canton facet counts from the search term", async () => {
    const { result } = await setup();
    act(() => result.current.setSearchTerm("hof"));
    await waitFor(() => {
      // "Hof Meier" + "Hof Müller" (BE) and "Bauernhof Rossi" (ZH) all contain
      // "hof"; "Ferme Dubois" (VD) does not.
      expect(result.current.cantonCounts.BE).toBe(2);
      expect(result.current.cantonCounts.ZH).toBe(1);
      expect(result.current.cantonCounts.VD ?? 0).toBe(0);
    });
  });

  it("sorts by name when requested", async () => {
    const { result } = await setup();
    act(() => result.current.setSortOption("name"));
    expect(result.current.visibleFarms.map((f) => f.name)).toEqual([
      "Bauernhof Rossi",
      "Ferme Dubois",
      "Hof Meier",
      "Hof Müller",
    ]);
  });

  it("resets all filters", async () => {
    const { result } = await setup();
    act(() => {
      result.current.setSelectedCanton("ZH");
      result.current.setSearchTerm("rossi");
    });
    act(() => result.current.resetFilters());
    expect(result.current.selectedCanton).toBe("all");
    expect(result.current.searchTerm).toBe("");
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it("exposes the canton options derived from the data", async () => {
    const { result } = await setup();
    expect([...result.current.cantonOptions].sort()).toEqual([
      "BE",
      "VD",
      "ZH",
    ]);
  });

  it("mirrors active filters into the URL query string", async () => {
    const { result } = await setup();
    act(() => result.current.setSelectedCanton("ZH"));
    await waitFor(() => expect(window.location.search).toContain("canton=ZH"));
  });

  it("reapplies every shareable filter when browser history changes", async () => {
    const { result } = await setup();
    window.history.replaceState(
      null,
      "",
      "/?q=rossi&canton=ZH&cat=Gem%C3%BCse,Milchprodukte&match=all&sort=canton&view=list",
    );

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    await waitFor(() => {
      expect(result.current.searchTerm).toBe("rossi");
      expect(result.current.selectedCanton).toBe("ZH");
      expect(result.current.selectedCategories).toEqual([
        "Gemüse",
        "Milchprodukte",
      ]);
      expect(result.current.categoryMatchMode).toBe("all");
      expect(result.current.effectiveSort).toBe("canton");
      expect(result.current.viewMode).toBe("list");
    });
  });

  it("supports any/all category matching and records a selected category", async () => {
    const farms = [
      farm({ id: "veg", categories: ["Gemüse"] }),
      farm({ id: "dairy", categories: ["Milchprodukte"] }),
      farm({ id: "both", categories: ["Gemüse", "Milchprodukte"] }),
    ];
    const { result } = await setup(farms);

    act(() => {
      result.current.setSelectedCategories(["Gemüse", "Milchprodukte"]);
      result.current.setCategoryMatchMode("any");
    });
    await waitFor(() => expect(result.current.visibleFarms).toHaveLength(3));

    act(() => result.current.setCategoryMatchMode("all"));
    await waitFor(() =>
      expect(result.current.visibleFarms.map((entry) => entry.id)).toEqual([
        "both",
      ]),
    );

    act(() => result.current.toggleCategory("Früchte"));
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(SEARCH_STATS_STORAGE_KEY) ?? "{}",
        ),
      ).toEqual({ Früchte: 1 }),
    );
    expect(result.current.selectedCategories).toEqual([
      "Gemüse",
      "Milchprodukte",
      "Früchte",
    ]);

    act(() => result.current.toggleCategory("Früchte"));
    expect(result.current.selectedCategories).toEqual([
      "Gemüse",
      "Milchprodukte",
    ]);
  });

  it("grows the visible page size via loadMore", async () => {
    const many = Array.from({ length: PAGE_SIZE * 2 }, (_, i) =>
      farm({ id: `m${i}`, canton: "BE" }),
    );
    const { result } = await setup(many);
    expect(result.current.visibleCount).toBe(PAGE_SIZE);
    act(() => result.current.loadMore());
    expect(result.current.visibleCount).toBe(PAGE_SIZE * 2);
  });

  it("refreshes through the Next router without changing directory state", async () => {
    const { result } = await setup();
    act(() => result.current.refreshDirectory());
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(result.current.visibleFarms).toHaveLength(FARMS.length);
  });

  it("uses a granted location for nearest sorting and can clear it again", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: { latitude: 46.95, longitude: 7.45 },
          } as GeolocationPosition),
      },
    });
    const { result } = await setup([
      farm({ id: "far", coordinates: "47.3769,8.5417" }),
      farm({ id: "near", coordinates: "46.95,7.45" }),
    ]);

    act(() => result.current.locateMe());
    await waitFor(() => {
      expect(result.current.originCoords).toEqual({
        latitude: 46.95,
        longitude: 7.45,
      });
      expect(result.current.effectiveSort).toBe("nearest");
    });
    expect(result.current.visibleFarms.map((entry) => entry.id)).toEqual([
      "near",
      "far",
    ]);
    expect(window.localStorage.getItem(LOCATION_STORAGE_KEY)).toBe(
      JSON.stringify({ latitude: 46.95, longitude: 7.45 }),
    );

    act(() => result.current.setRadiusKm(10));
    await waitFor(() =>
      expect(result.current.visibleFarms.map((entry) => entry.id)).toEqual([
        "near",
      ]),
    );

    act(() => result.current.clearLocation());
    expect(result.current.originCoords).toBeNull();
    expect(result.current.radiusKm).toBeNull();
    expect(result.current.effectiveSort).toBe("newest");
    expect(window.localStorage.getItem(LOCATION_STORAGE_KEY)).toBeNull();
  });

  it("surfaces a geolocation permission denial", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          failure: PositionErrorCallback,
        ) =>
          failure({
            code: 1,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      },
    });
    const { result } = await setup();

    act(() => result.current.locateMe());
    await waitFor(() =>
      expect(result.current.locationError).toMatch(
        /Location access is blocked/,
      ),
    );
    expect(result.current.isLocating).toBe(false);
  });

  // A shared "?radius=25" link used to empty the directory for anyone who
  // hadn't shared their location: every distance was null, and a null distance
  // can never satisfy a real radius. The radius control only renders while
  // location is active, so there was no visible way back either.
  describe("radius without a location", () => {
    it("keeps every farm visible when a radius arrives from the URL with no origin", async () => {
      // The radius now arrives already parsed, from the server, instead of
      // being read out of window.location after mount — same shared link,
      // same guard.
      const { result } = await setup(FARMS, { radiusKm: 25 });
      await waitFor(() => expect(result.current.radiusKm).toBe(25));
      expect(result.current.originCoords).toBeNull();
      expect(result.current.visibleFarms).toHaveLength(FARMS.length);
      expect(result.current.activeFiltersCount).toBe(0);
      expect(result.current.activeRadiusKm).toBeNull();
    });

    it("does not propagate a radius into the URL while there is no origin", async () => {
      const { result } = await setup();
      act(() => result.current.setRadiusKm(25));
      await waitFor(() => expect(result.current.radiusKm).toBe(25));
      expect(window.location.search).not.toContain("radius=");
    });
  });

  // "newest" is the default sort and re-runs on every filter change, so its
  // comparator reads precomputed timestamps rather than parsing dates per
  // comparison. Guard the ordering that optimisation has to preserve.
  describe("newest sort", () => {
    it("orders farms newest-first", async () => {
      const { result } = await setup([
        farm({ id: "old", created_at: "2026-01-01T00:00:00Z" }),
        farm({ id: "new", created_at: "2026-06-01T00:00:00Z" }),
        farm({ id: "mid", created_at: "2026-03-01T00:00:00Z" }),
      ]);
      expect(result.current.visibleFarms.map((f) => f.id)).toEqual([
        "new",
        "mid",
        "old",
      ]);
    });

    it("keeps a stable order when a created_at is unparseable", async () => {
      const { result } = await setup([
        farm({ id: "good", created_at: "2026-06-01T00:00:00Z" }),
        farm({ id: "bad", created_at: "not-a-date" }),
      ]);
      // The broken row sorts last (treated as epoch) instead of poisoning the
      // comparator with NaN, which would scramble the whole list.
      expect(result.current.visibleFarms.map((f) => f.id)).toEqual([
        "good",
        "bad",
      ]);
    });
  });
});
