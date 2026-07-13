import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("renames the active collection", async () => {
    const user = userEvent.setup();
    seedCollections([{ id: "c1", name: "Old name", farmIds: ["bern"] }]);
    renderView();
    await user.click(await screen.findByRole("button", { name: /Old name/i }));
    await user.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByDisplayValue("Old name");
    await user.clear(input);
    await user.type(input, "New name");
    // The confirm button is the Rename action in edit mode.
    await user.click(screen.getAllByRole("button", { name: /rename/i })[0]);
    expect(
      await screen.findByRole("button", { name: /New name/i }),
    ).toBeInTheDocument();
  });

  it("deletes the active collection and falls back to All saved", async () => {
    const user = userEvent.setup();
    seedFavorites(["bern"]);
    seedCollections([{ id: "c1", name: "Trash me", farmIds: ["bern"] }]);
    renderView();
    await user.click(await screen.findByRole("button", { name: /Trash me/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));
    // The collection tab is gone; All saved remains.
    expect(
      screen.queryByRole("button", { name: /Trash me/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /All saved/i }),
    ).toBeInTheDocument();
  });

  it("exports the shown farms to a CSV download", async () => {
    const user = userEvent.setup();
    seedFavorites(["bern", "zurich"]);
    const createUrl = vi.fn(() => "blob:mock");
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeUrl,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    renderView();
    await user.click(
      await screen.findByRole("button", { name: /export csv/i }),
    );
    expect(createUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
