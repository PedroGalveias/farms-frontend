import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import TripProvider from "@/components/trip/TripProvider";
import FarmQuickActions from "@/components/FarmQuickActions";
import type { Farm } from "@/types/farm";

const FARM: Farm = {
  id: "bern",
  name: "Hof Sonnenmatt",
  address: "Dorfstrasse 12, 3011 Bern",
  canton: "BE",
  coordinates: "46.9480,7.4474",
  categories: ["Gemüse"],
  created_at: "2026-02-02T10:00:00Z",
  updated_at: null,
};

function renderSheet(
  props: Partial<Parameters<typeof FarmQuickActions>[0]> = {},
) {
  const onClose = props.onClose ?? vi.fn();
  const onOpenDetails = props.onOpenDetails ?? vi.fn();
  render(
    <LanguageProvider>
      <PersonalizationProvider>
        <TripProvider>
          <FarmQuickActions
            farm={FARM}
            onClose={onClose}
            onOpenDetails={onOpenDetails}
          />
        </TripProvider>
      </PersonalizationProvider>
    </LanguageProvider>,
  );
  return { onClose, onOpenDetails };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FarmQuickActions", () => {
  it("renders the farm name and all four actions", () => {
    renderSheet();
    expect(screen.getByText("Hof Sonnenmatt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view details/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /visit plan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^share$/i }),
    ).toBeInTheDocument();
  });

  it("opens the detail and closes when 'View details' is tapped", async () => {
    const user = userEvent.setup();
    const { onClose, onOpenDetails } = renderSheet();

    await user.click(screen.getByRole("button", { name: /view details/i }));

    expect(onOpenDetails).toHaveBeenCalledWith(FARM);
    expect(onClose).toHaveBeenCalled();
  });

  it("falls back to copying the link when Web Share is unavailable", async () => {
    const user = userEvent.setup();
    // No navigator.share → clipboard fallback.
    delete (navigator as { share?: unknown }).share;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const { onClose } = renderSheet();
    await user.click(screen.getByRole("button", { name: /^share$/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/farm/bern"),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("toggles the saved state (label flips to 'Saved' on reopen)", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet();

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    // The action closes the sheet; the favourite is now persisted.
    expect(onClose).toHaveBeenCalled();

    cleanup();
    renderSheet();
    // Reopened for the same farm, it now reads as saved (favourites hydrate in
    // a post-mount effect, so wait for the label to flip).
    expect(
      await screen.findByRole("button", { name: /saved/i }),
    ).toBeInTheDocument();
  });
});
