import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import FarmCard from "@/components/FarmCard";
import { FAVORITES_STORAGE_KEY } from "@/lib/personalization";
import type { Farm } from "@/types/farm";

const haptic = vi.hoisted(() => vi.fn());
const playTick = vi.hoisted(() => vi.fn());
vi.mock("@/lib/haptics", async (orig) => ({
  ...(await orig<typeof import("@/lib/haptics")>()),
  haptic,
}));
vi.mock("@/lib/sound", () => ({ playTick }));

const FARM: Farm = {
  id: "bern",
  name: "Hof Sonnenmatt",
  address: "Dorfstrasse 12, 3011 Bern",
  canton: "BE",
  coordinates: "46.9480,7.4474",
  categories: ["Gemüse", "Früchte"],
  created_at: "2026-02-02T10:00:00Z",
  updated_at: null,
};

function renderCard(props: Partial<Parameters<typeof FarmCard>[0]> = {}) {
  return render(
    <LanguageProvider>
      <PersonalizationProvider>
        <FarmCard farm={FARM} {...props} />
      </PersonalizationProvider>
    </LanguageProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("FarmCard", () => {
  it("renders the farm name, address, and translated categories", () => {
    renderCard();
    expect(screen.getByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(screen.getByText(/Dorfstrasse 12/)).toBeInTheDocument();
    // German "Gemüse" renders as the English label in the default locale.
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
  });

  it("opens the detail when the card is clicked", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    renderCard({ onOpen });

    await user.click(
      screen.getByRole("button", { name: /view details: hof sonnenmatt/i }),
    );
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not render the open overlay when onOpen is omitted", () => {
    renderCard();
    // The favorite button is always present; only the full-card open overlay
    // is conditional on onOpen.
    expect(
      screen.queryByRole("button", { name: /view details/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the Maps link separate from the open action", async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    renderCard({ onOpen });

    const mapsLink = screen.getByRole("link");
    expect(mapsLink).toHaveAttribute("href", expect.stringContaining("maps"));
    await user.click(mapsLink);
    // Clicking the Maps link must not trigger the card's open action.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("favoriting fires haptic + sound and persists", () => {
    renderCard();
    const save = screen.getByRole("button", { name: /^save$/i });
    fireEvent.click(save);

    expect(haptic).toHaveBeenCalled();
    expect(playTick).toHaveBeenCalled();
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(
      JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"),
    ).toContain("bern");
  });

  it("shows a distance badge when a distance is provided", () => {
    renderCard({ distanceKm: 12.4 });
    expect(screen.getByText(/12\s*km/i)).toBeInTheDocument();
  });

  it("the compact list variant is a dense row with the heart in flow", () => {
    const { container } = renderCard({ variant: "list", onOpen: vi.fn() });
    const article = container.querySelector("article")!;
    // Compact radius, not the extended grid card's rounded-[26px].
    expect(article.className).toContain("rounded-2xl");
    const heart = within(article).getByRole("button", { name: /save/i });
    expect(heart.className).not.toContain("absolute");
  });
});
