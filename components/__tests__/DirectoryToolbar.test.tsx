import { type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import type { Farm } from "@/types/farm";

// The search box inside the toolbar uses next/navigation's useRouter, which
// needs the App Router context — stub it for the isolated component test.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const FARMS: Farm[] = [
  {
    id: "1",
    name: "Berghof",
    address: "Dorf 1",
    canton: "BE",
    coordinates: "46.9,7.4",
    categories: ["Gemüse"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
];

type ToolbarProps = ComponentProps<typeof DirectoryToolbar>;

function makeProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
  return {
    activeFiltersCount: 0,
    farms: FARMS,
    categoryOptions: ["Gemüse", "Früchte"],
    categoryCounts: { Gemüse: 1, Früchte: 1 },
    cantonCounts: { BE: 1 },
    cantonRegions: [{ key: "region_mittelland", cantons: ["BE"] }],
    categoryMatchMode: "any" as const,
    isRefreshing: false,
    isLocating: false,
    locationActive: false,
    locationError: null,
    onCategoryMatchModeChange: vi.fn(),
    onClearCanton: vi.fn(),
    onClearLocation: vi.fn(),
    onClearSearchTerm: vi.fn(),
    onCreateFarm: vi.fn(),
    onRadiusChange: vi.fn(),
    onRefresh: vi.fn(),
    onReset: vi.fn(),
    onSearchTermChange: vi.fn(),
    onSelectedCantonChange: vi.fn(),
    onToggleCategory: vi.fn(),
    onSortOptionChange: vi.fn(),
    onUseLocation: vi.fn(),
    onViewModeChange: vi.fn(),
    radiusKm: null,
    searchTerm: "",
    selectedCanton: "all",
    selectedCategories: [],
    sortOption: "newest" as const,
    viewMode: "grid" as const,
    ...overrides,
  };
}

function renderToolbar(overrides: Partial<ToolbarProps> = {}) {
  const props = makeProps(overrides);
  render(
    <LanguageProvider>
      <DirectoryToolbar {...props} />
    </LanguageProvider>,
  );
  return props;
}

describe("DirectoryToolbar", () => {
  it("shows the active-filters pill only when filters are set", () => {
    renderToolbar({ activeFiltersCount: 0 });
    expect(screen.queryByText("2 filters")).not.toBeInTheDocument();
    cleanup();
    renderToolbar({ activeFiltersCount: 2 });
    expect(screen.getByText("2 filters")).toBeInTheDocument();
  });

  it("changing the sort fires onSortOptionChange", () => {
    const props = renderToolbar();
    const sort = screen
      .getAllByRole("combobox")
      .find((el) =>
        within(el).queryByText(/newest first/i),
      ) as HTMLSelectElement;
    fireEvent.change(sort, { target: { value: "name" } });
    expect(props.onSortOptionChange).toHaveBeenCalledWith("name");
  });

  it("switching to list view fires onViewModeChange", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /list layout/i }));
    expect(props.onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("selecting a canton fires onSelectedCantonChange", () => {
    const props = renderToolbar();
    const cantonSelect = screen
      .getAllByRole("combobox")
      .find((el) =>
        within(el).queryByText(/all cantons/i),
      ) as HTMLSelectElement;
    fireEvent.change(cantonSelect, { target: { value: "BE" } });
    expect(props.onSelectedCantonChange).toHaveBeenCalledWith("BE");
  });

  it("the nearest sort option only appears once location is active", () => {
    const { rerender } = render(
      <LanguageProvider>
        <DirectoryToolbar {...makeProps()} />
      </LanguageProvider>,
    );
    expect(screen.queryByRole("option", { name: /nearest/i })).toBeNull();
    rerender(
      <LanguageProvider>
        <DirectoryToolbar {...makeProps({ locationActive: true })} />
      </LanguageProvider>,
    );
    expect(
      screen.getByRole("option", { name: /nearest/i }),
    ).toBeInTheDocument();
  });
});
