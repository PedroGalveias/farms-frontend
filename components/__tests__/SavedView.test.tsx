import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import SavedView from "@/components/saved/SavedView";
import { FAVORITES_STORAGE_KEY } from "@/lib/personalization";
import { COLLECTIONS_STORAGE_KEY } from "@/lib/collections";
import type { Farm } from "@/types/farm";

const FARMS: Farm[] = [
  {
    id: "bern",
    name: "Hof Sonnenmatt",
    address: "Dorfstrasse 12, 3011 Bern",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "zurich",
    name: "Bauernhof Grünmatt",
    address: "Feldweg 3, 8001 Zürich",
    canton: "ZH",
    coordinates: "47.3769,8.5417",
    categories: ["Dairy"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  },
];

function seedFavorites(ids: string[]) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
}

function seedCollections(
  collections: { id: string; name: string; farmIds: string[] }[],
) {
  window.localStorage.setItem(
    COLLECTIONS_STORAGE_KEY,
    JSON.stringify(collections),
  );
}

function renderView() {
  render(
    <LanguageProvider>
      <PersonalizationProvider>
        <SavedView farms={FARMS} />
      </PersonalizationProvider>
    </LanguageProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe("SavedView", () => {
  it("shows the empty state with a browse link when nothing is saved", () => {
    renderView();
    expect(screen.getByText("No saved farms yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse/i })).toBeInTheDocument();
  });

  it("lists favorited farms and counts them on the 'All saved' tab", async () => {
    seedFavorites(["bern", "zurich"]);
    renderView();

    expect(await screen.findByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(screen.getByText("Bauernhof Grünmatt")).toBeInTheDocument();

    const allTab = screen.getByRole("button", { name: /All saved/i });
    expect(within(allTab).getByText("2")).toBeInTheDocument();
  });

  it("switches to a collection's farms when its tab is selected", async () => {
    seedFavorites(["bern", "zurich"]);
    seedCollections([{ id: "c1", name: "Weekend", farmIds: ["zurich"] }]);
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole("button", { name: /Weekend/i }));

    expect(screen.getByText("Bauernhof Grünmatt")).toBeInTheDocument();
    expect(screen.queryByText("Hof Sonnenmatt")).not.toBeInTheDocument();
  });

  it("shows the collection-empty message for an empty collection", async () => {
    seedCollections([{ id: "c1", name: "Empty", farmIds: [] }]);
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole("button", { name: /Empty/i }));
    expect(
      screen.getByText("No farms in this collection yet."),
    ).toBeInTheDocument();
  });

  it("creates a new collection and activates its tab", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: /New collection/i }));
    await user.type(
      screen.getByPlaceholderText("Collection name"),
      "Summer haul",
    );
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(
      await screen.findByRole("button", { name: /Summer haul/i }),
    ).toBeInTheDocument();
  });
});
