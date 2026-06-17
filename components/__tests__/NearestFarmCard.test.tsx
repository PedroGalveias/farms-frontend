import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import NearestFarmCard from "@/components/NearestFarmCard";
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

function mockGeolocation(coords: { latitude: number; longitude: number }) {
  const getCurrentPosition = vi.fn((success: PositionCallback) =>
    success({
      coords: { ...coords, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition),
  );
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
  return getCurrentPosition;
}

function renderCard(onOpenFarm = vi.fn()) {
  render(
    <LanguageProvider>
      <NearestFarmCard farms={FARMS} onOpenFarm={onOpenFarm} />
    </LanguageProvider>,
  );
  return onOpenFarm;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { geolocation?: unknown }).geolocation;
});

describe("NearestFarmCard", () => {
  it("starts idle with a location prompt and does not request location on mount", () => {
    const getCurrentPosition = mockGeolocation({
      latitude: 46.95,
      longitude: 7.45,
    });
    renderCard();

    expect(screen.getByText(/closest to you/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /use my location/i }),
    ).toBeInTheDocument();
    // Privacy: geolocation must only be read on tap, never on render.
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("shows the nearest farm after locating", async () => {
    mockGeolocation({ latitude: 46.95, longitude: 7.45 });
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));

    expect(screen.getByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(screen.getByText(/Dorfstrasse 12/)).toBeInTheDocument();
    expect(screen.getByText("< 1 km")).toBeInTheDocument();
  });

  it("opens the nearest farm when the result card is clicked", async () => {
    mockGeolocation({ latitude: 46.95, longitude: 7.45 });
    const user = userEvent.setup();
    const onOpenFarm = renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));
    await user.click(screen.getByText("Hof Sonnenmatt"));

    expect(onOpenFarm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bern" }),
    );
  });

  it("shows an error when geolocation is unavailable", async () => {
    delete (navigator as { geolocation?: unknown }).geolocation;
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
  });
});
