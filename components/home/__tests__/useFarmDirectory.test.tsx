import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import {
  useFarmDirectory,
  PAGE_SIZE,
} from "@/components/home/useFarmDirectory";
import type { Farm } from "@/types/farm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
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
async function setup(farms = FARMS) {
  const view = renderHook(() => useFarmDirectory(farms), { wrapper });
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
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

  it("grows the visible page size via loadMore", async () => {
    const many = Array.from({ length: PAGE_SIZE * 2 }, (_, i) =>
      farm({ id: `m${i}`, canton: "BE" }),
    );
    const { result } = await setup(many);
    expect(result.current.visibleCount).toBe(PAGE_SIZE);
    act(() => result.current.loadMore());
    expect(result.current.visibleCount).toBe(PAGE_SIZE * 2);
  });
});
