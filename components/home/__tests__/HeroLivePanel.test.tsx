import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import HeroLivePanel from "@/components/home/HeroLivePanel";
import { SEASONAL_BY_MONTH } from "@/lib/seasonal";
import type { Farm } from "@/types/farm";

function farm(id: string, name: string, createdAt: string): Farm {
  return {
    id,
    name,
    address: "Dorfstrasse 1",
    canton: "BE",
    coordinates: "46.9,7.4",
    categories: ["Vegetables"],
    created_at: createdAt,
    updated_at: null,
  };
}

const FARMS = [
  farm("a", "Alter Hof", "2026-01-05T00:00:00Z"),
  farm("b", "Brandneu", "2026-07-01T00:00:00Z"),
  farm("c", "Chornhof", "2026-03-10T00:00:00Z"),
  farm("d", "Dorfhof", "2026-06-01T00:00:00Z"),
];

function renderPanel(onOpenFarm = vi.fn()) {
  render(
    <LanguageProvider>
      <HeroLivePanel cantonCount={9} farms={FARMS} onOpenFarm={onOpenFarm} />
    </LanguageProvider>,
  );
  return onOpenFarm;
}

describe("HeroLivePanel", () => {
  it("shows in-season chips linking to the seasonal calendar", () => {
    renderPanel();
    expect(screen.getByText("In season now")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/seasonal");
    // At least one produce chip for the current month.
    expect(link.querySelectorAll("span.rounded-full").length).toBeGreaterThan(
      0,
    );
    // Months with more items than the chip limit surface the surplus as +N.
    const monthItems = SEASONAL_BY_MONTH[new Date().getMonth()] ?? [];
    if (monthItems.length > 4) {
      expect(screen.getByText(`+${monthItems.length - 4}`)).toBeInTheDocument();
    }
  });

  it("lists the three newest farms, most recent first", () => {
    renderPanel();
    const buttons = screen.getAllByRole("button");
    const names = buttons.map((b) => b.textContent);
    expect(names[0]).toContain("Brandneu"); // 2026-07
    expect(names[1]).toContain("Dorfhof"); // 2026-06
    expect(names[2]).toContain("Chornhof"); // 2026-03
    expect(names.join(" ")).not.toContain("Alter Hof");
  });

  it("opens a farm when its row is clicked", () => {
    const onOpenFarm = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Brandneu/ }));
    expect(onOpenFarm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b" }),
    );
  });

  it("shows the coverage numbers", () => {
    renderPanel();
    expect(screen.getByText("farms listed")).toBeInTheDocument();
    expect(screen.getByText("cantons covered")).toBeInTheDocument();
  });
});
