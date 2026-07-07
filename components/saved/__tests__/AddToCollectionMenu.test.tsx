import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PersonalizationProvider from "@/components/personalization/PersonalizationProvider";
import AddToCollectionMenu from "@/components/saved/AddToCollectionMenu";

const haptic = vi.hoisted(() => vi.fn());
const playTick = vi.hoisted(() => vi.fn());
vi.mock("@/lib/haptics", async (orig) => ({
  ...(await orig<typeof import("@/lib/haptics")>()),
  haptic,
}));
vi.mock("@/lib/sound", () => ({ playTick }));

function renderMenu() {
  render(
    <LanguageProvider>
      <PersonalizationProvider>
        <AddToCollectionMenu farmId="farm-1" />
      </PersonalizationProvider>
    </LanguageProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("AddToCollectionMenu", () => {
  it("opening the menu gives feedback and reveals the create field", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    expect(haptic).toHaveBeenCalled();
    expect(playTick).toHaveBeenCalled();
    expect(
      screen.getByPlaceholderText(/collection name|name/i),
    ).toBeInTheDocument();
  });

  it("creating a collection adds the farm and gives confirmation feedback", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));

    fireEvent.change(screen.getByPlaceholderText(/collection name|name/i), {
      target: { value: "Weekend trips" },
    });
    haptic.mockClear();
    playTick.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    // The new collection appears as a toggle row.
    expect(screen.getByText("Weekend trips")).toBeInTheDocument();
    expect(haptic).toHaveBeenCalled();
    expect(playTick).toHaveBeenCalled();
  });

  it("toggling a collection membership adds then removes, with feedback each time", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: /add to collection/i }));
    fireEvent.change(screen.getByPlaceholderText(/collection name|name/i), {
      target: { value: "Cheese" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    const row = screen.getByRole("button", { name: /cheese/i });
    // Created with the farm as a member.
    expect(row).toHaveAttribute("aria-pressed", "true");

    haptic.mockClear();
    playTick.mockClear();
    fireEvent.click(row); // remove
    expect(haptic).toHaveBeenCalledTimes(1);
    expect(playTick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /cheese/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
