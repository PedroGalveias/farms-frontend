import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import PwaRegister from "@/components/PwaRegister";

const defaultUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value,
  });
}

function renderPwaRegister() {
  render(
    <LanguageProvider>
      <PwaRegister />
    </LanguageProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  setUserAgent(defaultUserAgent);
  cleanup();
});

describe("PwaRegister", () => {
  it("shows the iOS install hint even when browser storage is unavailable", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
      });

    renderPwaRegister();

    expect(
      await screen.findByText("Use Share, then Add to Home Screen."),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    expect(setItem).toHaveBeenCalledWith("farms.install.dismissed", "1");
  });

  it("does not resurface an iOS install hint the visitor dismissed", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    window.localStorage.setItem("farms.install.dismissed", "1");

    renderPwaRegister();

    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
  });
});
