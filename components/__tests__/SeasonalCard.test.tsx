import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import SeasonalCard from "@/components/SeasonalCard";

function renderCard() {
  return render(
    <LanguageProvider>
      <SeasonalCard />
    </LanguageProvider>,
  );
}

describe("SeasonalCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the current month and its in-season produce", () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    renderCard();

    expect(screen.getByText("June")).toBeInTheDocument();
    expect(screen.getByText(/In season now/i)).toBeInTheDocument();
    expect(screen.getByText(/Strawberries/)).toBeInTheDocument();
    expect(screen.getByText(/Cherries/)).toBeInTheDocument();
  });

  it("changes produce with the month", () => {
    vi.setSystemTime(new Date("2026-12-10T12:00:00Z"));
    renderCard();

    expect(screen.getByText("December")).toBeInTheDocument();
    expect(screen.getByText(/Apples/)).toBeInTheDocument();
  });

  it("renders the seasonal promo copy", () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    renderCard();

    expect(screen.getByText(/eat with the season/i)).toBeInTheDocument();
  });
});
