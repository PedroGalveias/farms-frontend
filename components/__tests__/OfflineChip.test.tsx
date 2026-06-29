import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import OfflineChip from "@/components/OfflineChip";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
}

function renderChip() {
  render(
    <LanguageProvider>
      <OfflineChip />
    </LanguageProvider>,
  );
}

afterEach(() => {
  setOnline(true);
});

describe("OfflineChip", () => {
  it("stays hidden while online", async () => {
    setOnline(true);
    renderChip();
    // Let the deferred initial read run.
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("appears when offline and disappears when back online", async () => {
    renderChip();
    await act(async () => {
      setOnline(false);
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/offline/i);

    await act(async () => {
      setOnline(true);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
