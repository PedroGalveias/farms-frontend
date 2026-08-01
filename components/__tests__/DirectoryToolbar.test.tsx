import { type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    // GlassSelect listbox: open the trigger, click the option.
    fireEvent.click(screen.getByRole("button", { name: "Sort by" }));
    fireEvent.click(screen.getByRole("option", { name: /farm name/i }));
    expect(props.onSortOptionChange).toHaveBeenCalledWith("name");
  });

  it("switching to list view fires onViewModeChange", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /list layout/i }));
    expect(props.onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("selecting a canton fires onSelectedCantonChange", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: "Canton" }));
    fireEvent.click(screen.getByRole("option", { name: /BE · Bern/i }));
    expect(props.onSelectedCantonChange).toHaveBeenCalledWith("BE");
  });

  it("the nearest sort option only appears once location is active", () => {
    const { rerender } = render(
      <LanguageProvider>
        <DirectoryToolbar {...makeProps()} />
      </LanguageProvider>,
    );
    // Options only exist while the listbox is open — check inside it.
    fireEvent.click(screen.getByRole("button", { name: "Sort by" }));
    expect(screen.queryByRole("option", { name: /nearest/i })).toBeNull();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    rerender(
      <LanguageProvider>
        <DirectoryToolbar {...makeProps({ locationActive: true })} />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort by" }));
    expect(
      screen.getByRole("option", { name: /nearest/i }),
    ).toBeInTheDocument();
  });

  it("typing in the search box fires onSearchTermChange", () => {
    const props = renderToolbar();
    const input = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(input, { target: { value: "cheese" } });
    expect(props.onSearchTermChange).toHaveBeenCalledWith("cheese");
  });

  it("switching to map view fires onViewModeChange", () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /show map/i }));
    expect(props.onViewModeChange).toHaveBeenCalledWith("map");
  });

  it("Use my location requests the browser position", () => {
    const props = renderToolbar({ locationActive: false });
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(props.onUseLocation).toHaveBeenCalled();
  });

  it("with location active, a radius button fires onRadiusChange and clear fires onClearLocation", () => {
    const props = renderToolbar({ locationActive: true });
    fireEvent.click(screen.getByRole("button", { name: /within 25 km/i }));
    expect(props.onRadiusChange).toHaveBeenCalledWith(25);
    fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));
    expect(props.onClearLocation).toHaveBeenCalled();
  });

  it("Reset and Refresh fire their handlers", () => {
    const props = renderToolbar({ activeFiltersCount: 1 });
    fireEvent.click(screen.getByRole("button", { name: /^reset$/i }));
    expect(props.onReset).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^refresh$/i }));
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it("a category chip fires onToggleCategory", () => {
    const props = renderToolbar();
    // Category chips are labelled with their localized name.
    const veg = screen.getAllByRole("button", { name: /vegetables/i })[0];
    fireEvent.click(veg);
    expect(props.onToggleCategory).toHaveBeenCalled();
  });

  it("Add a farm fires onCreateFarm", () => {
    const props = renderToolbar();
    const add = screen.getAllByRole("button", { name: /add a farm/i })[0];
    fireEvent.click(add);
    expect(props.onCreateFarm).toHaveBeenCalled();
  });

  // The ALL/ANY toggle decides whether picking two categories means "farms
  // selling both" or "farms selling either" — the single control with the
  // largest effect on what the directory shows. It had no coverage at all.
  describe("category match mode", () => {
    it("stays hidden until a second category makes the choice meaningful", () => {
      renderToolbar({ selectedCategories: ["Gemüse"] });
      expect(
        screen.queryByRole("button", { name: /^match all$/i }),
      ).not.toBeInTheDocument();
      cleanup();

      renderToolbar({ selectedCategories: ["Gemüse", "Früchte"] });
      expect(
        screen.getByRole("button", { name: /^match all$/i }),
      ).toBeInTheDocument();
    });

    it("reports the current mode and switches to the other one", () => {
      const props = renderToolbar({
        categoryMatchMode: "any",
        selectedCategories: ["Gemüse", "Früchte"],
      });
      const all = screen.getByRole("button", { name: /^match all$/i });
      const any = screen.getByRole("button", { name: /^match any$/i });

      // aria-pressed is how a screen-reader user knows which mode is live.
      expect(any).toHaveAttribute("aria-pressed", "true");
      expect(all).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(all);
      expect(props.onCategoryMatchModeChange).toHaveBeenCalledWith("all");
    });

    it("mirrors the opposite selection when the mode is 'all'", () => {
      const props = renderToolbar({
        categoryMatchMode: "all",
        selectedCategories: ["Gemüse", "Früchte"],
      });
      expect(
        screen.getByRole("button", { name: /^match all$/i }),
      ).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByRole("button", { name: /^match any$/i }));
      expect(props.onCategoryMatchModeChange).toHaveBeenCalledWith("any");
    });
  });

  // The dismiss chips under the toolbar are the only way to drop one filter
  // without resetting everything, and each had an untested handler.
  describe("active filter chips", () => {
    it("a search chip shows the term and clears just that", () => {
      const props = renderToolbar({
        activeFiltersCount: 1,
        searchTerm: "Berghof",
      });
      const chip = screen.getByRole("button", { name: /Berghof/ });
      fireEvent.click(chip);
      expect(props.onClearSearchTerm).toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("a whitespace-only search term produces no chip", () => {
      renderToolbar({ activeFiltersCount: 1, searchTerm: "   " });
      // `.trim()` gates the chip — otherwise a stray space would render an
      // empty, unlabelled dismiss button. Anchored on the "Search:" chip
      // prefix so this doesn't also match the search input itself.
      expect(
        screen.queryByRole("button", { name: /^Search:/ }),
      ).not.toBeInTheDocument();
    });

    it("a canton chip names the canton and clears just that", () => {
      const props = renderToolbar({
        activeFiltersCount: 1,
        selectedCanton: "BE",
      });
      const chip = screen.getByRole("button", { name: /Bern/ });
      fireEvent.click(chip);
      expect(props.onClearCanton).toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("shows no chips at all when nothing is filtered", () => {
      renderToolbar({
        activeFiltersCount: 0,
        searchTerm: "Berghof",
        selectedCanton: "BE",
      });
      // The whole chip row is gated on activeFiltersCount, so stale props
      // must not leak dismissable chips onto an unfiltered directory.
      expect(screen.queryByRole("button", { name: /Bern/ })).toBeNull();
    });
  });

  describe("location states", () => {
    it("disables the location button and says so while locating", () => {
      renderToolbar({ isLocating: true });
      const button = screen.getByRole("button", { name: /locating/i });
      expect(button).toBeDisabled();
    });

    it("surfaces a location error to the user", () => {
      renderToolbar({ locationError: "Location permission denied" });
      expect(
        screen.getByText("Location permission denied"),
      ).toBeInTheDocument();
    });

    it("shows no error text when there is no error", () => {
      renderToolbar({ locationError: null });
      expect(screen.queryByText(/permission denied/i)).toBeNull();
    });
  });
});
