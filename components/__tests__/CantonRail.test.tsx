import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import CantonRail from "@/components/home/CantonRail";
import type { Farm } from "@/types/farm";

function farm(id: string, canton: string): Farm {
  return {
    id,
    name: `Farm ${id}`,
    address: "Dorfstrasse 1",
    canton,
    coordinates: "46.9,7.4",
    categories: ["Vegetables"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: null,
  };
}

const FARMS = [farm("a", "BE"), farm("b", "BE"), farm("c", "ZH")];

function renderRail(selectedCanton = "all", onSelectCanton = vi.fn()) {
  render(
    <LanguageProvider>
      <CantonRail
        farms={FARMS}
        onSelectCanton={onSelectCanton}
        selectedCanton={selectedCanton}
      />
    </LanguageProvider>,
  );
  return onSelectCanton;
}

describe("CantonRail", () => {
  it("renders nothing without farms", () => {
    const { container } = render(
      <LanguageProvider>
        <CantonRail farms={[]} onSelectCanton={vi.fn()} selectedCanton="all" />
      </LanguageProvider>,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("lists cantons busiest-first with counts and a hub link", () => {
    renderRail();

    const chips = screen.getAllByRole("button");
    expect(chips[0]).toHaveTextContent(/Bern/);
    expect(chips[0]).toHaveTextContent("2");
    expect(chips[1]).toHaveTextContent(/Zurich|Zürich/);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/canton");
  });

  it("selects a canton on tap and clears it on a second tap", () => {
    const onSelect = renderRail();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelect).toHaveBeenCalledWith("BE");

    const onSelectActive = vi.fn();
    render(
      <LanguageProvider>
        <CantonRail
          farms={FARMS}
          onSelectCanton={onSelectActive}
          selectedCanton="BE"
        />
      </LanguageProvider>,
    );
    const active = screen
      .getAllByRole("button")
      .find((el) => el.getAttribute("aria-pressed") === "true");
    expect(active).toBeDefined();
    fireEvent.click(active!);
    expect(onSelectActive).toHaveBeenCalledWith("all");
  });
});
