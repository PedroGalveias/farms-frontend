import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import GoBackButton from "@/components/GoBackButton";

const router = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", {
    configurable: true,
    value: length,
  });
}

function renderButton() {
  render(
    <LanguageProvider>
      <GoBackButton />
    </LanguageProvider>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GoBackButton", () => {
  it("goes back when there is in-app history", async () => {
    setHistoryLength(3);
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button"));

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("falls back to home on a cold landing (no history)", async () => {
    setHistoryLength(1);
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button"));

    expect(router.push).toHaveBeenCalledWith("/");
    expect(router.back).not.toHaveBeenCalled();
  });
});
