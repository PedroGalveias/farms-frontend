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
  // The card now remembers a located position; isolate tests from each other.
  window.localStorage.clear();
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

    expect(await screen.findByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(screen.getByText(/Dorfstrasse 12/)).toBeInTheDocument();
    expect(screen.getByText("< 1 km")).toBeInTheDocument();
  });

  it("opens the nearest farm when the result card is clicked", async () => {
    mockGeolocation({ latitude: 46.95, longitude: 7.45 });
    const user = userEvent.setup();
    const onOpenFarm = renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));
    await user.click(await screen.findByText("Hof Sonnenmatt"));

    expect(onOpenFarm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bern" }),
    );
  });

  it("shows an error when geolocation is unavailable", async () => {
    delete (navigator as { geolocation?: unknown }).geolocation;
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));
    expect(
      await screen.findByText(/isn't available in this browser/i),
    ).toBeInTheDocument();
  });

  it("restores a remembered location on mount without prompting", async () => {
    const getCurrentPosition = mockGeolocation({
      latitude: 46.95,
      longitude: 7.45,
    });
    window.localStorage.setItem(
      "farms.location",
      JSON.stringify({ latitude: 46.95, longitude: 7.45 }),
    );
    renderCard();

    // Shows the nearest farm straight away, never calling geolocation.
    expect(await screen.findByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("surfaces a denied-permission message", async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error?: PositionErrorCallback) =>
        error?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    );
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true,
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: /use my location/i }));
    expect(await screen.findByText(/blocked/i)).toBeInTheDocument();
  });
});
