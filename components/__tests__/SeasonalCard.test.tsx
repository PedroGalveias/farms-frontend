import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import SeasonalCard from "@/components/SeasonalCard";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

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
    // December is winter brassicas/roots — apples are stored, not harvested.
    expect(screen.getByText(/Kale/)).toBeInTheDocument();
  });

  it("renders the seasonal promo copy", () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    renderCard();

    expect(screen.getByText(/eat with the season/i)).toBeInTheDocument();
  });

  it("links to quick search with the in-season groups when tapped", async () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    // userEvent needs real timers.
    vi.useRealTimers();
    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getByRole("button", { name: /find these near you/i }),
    );
    // Now deep-links the specific in-season products (match any), e.g. cherries.
    expect(push).toHaveBeenCalledTimes(1);
    const url = push.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/quick-search\?products=/);
    expect(url).toContain("Kirschen");
    expect(url).toContain("match=any");
  });
});
