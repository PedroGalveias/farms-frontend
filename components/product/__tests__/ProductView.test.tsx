import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import ProductView from "@/components/product/ProductView";
import type { Farm } from "@/types/farm";

function farm(id: string, name: string): Farm {
  return {
    id,
    name,
    address: "Dorfstrasse 1, 3000 Bern",
    canton: "BE",
    coordinates: "46.9,7.4",
    categories: ["Milchprodukte"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  };
}

const FARMS = [farm("a", "Alpkäserei Alpha"), farm("b", "Berghof Beta")];

function renderView(
  overrides: Partial<Parameters<typeof ProductView>[0]> = {},
) {
  return render(
    <LanguageProvider>
      <ProductView
        category="Milchprodukte"
        farms={FARMS}
        siblings={[{ slug: "fruits", category: "Früchte", count: 3 }]}
        topCantons={[
          ["BE", 12],
          ["ZH", 5],
        ]}
        totalCount={60}
        {...overrides}
      />
    </LanguageProvider>,
  );
}

describe("ProductView", () => {
  it("renders the localized heading, summary, and farm cards", () => {
    renderView();
    expect(
      screen.getByRole("heading", { name: "Dairy from Swiss farms" }),
    ).toBeInTheDocument();
    expect(screen.getByText("60 farms offer Dairy")).toBeInTheDocument();
    expect(screen.getByText("Alpkäserei Alpha")).toBeInTheDocument();
    expect(screen.getByText("Berghof Beta")).toBeInTheDocument();
  });

  it("links into the pre-filtered directory and canton cross-links", () => {
    renderView();
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    // Open-in-directory + see-all both target the pre-filtered directory.
    expect(
      hrefs.filter((href) => href === "/?cat=Milchprodukte").length,
    ).toBeGreaterThanOrEqual(2);
    // Canton cross-link with the count.
    const canton = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/canton/be");
    expect(canton).toBeDefined();
    expect(canton).toHaveTextContent("Bern");
    expect(canton).toHaveTextContent("12");
    // See-all appears because totalCount exceeds the rendered farms.
    expect(screen.getByText(/see all 60 farms/i)).toBeInTheDocument();
  });

  it("shows sibling products with counts", () => {
    renderView();
    const sibling = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/product/fruits");
    expect(sibling).toBeDefined();
    expect(sibling).toHaveTextContent("Fruits");
    expect(sibling).toHaveTextContent("3");
  });

  it("renders the empty state when no farms offer the product", () => {
    renderView({ farms: [], totalCount: 0, topCantons: [], siblings: [] });
    // Appears twice: as the header summary and inside the empty-state panel.
    expect(
      screen.getAllByText(/no farms offering dairy listed yet/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("link", { name: /browse the full directory/i }),
    ).toBeInTheDocument();
  });
});
