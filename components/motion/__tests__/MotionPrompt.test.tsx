import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import MotionPrompt from "@/components/motion/MotionPrompt";

const realMatchMedia = window.matchMedia;

function mockMedia(overrides: Record<string, boolean>) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: overrides[query] ?? false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const REDUCE = "(prefers-reduced-motion: reduce)";
const FINE = "(any-pointer: fine)";

function renderPrompt() {
  render(
    <LanguageProvider>
      <MotionPrompt />
    </LanguageProvider>,
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  window.matchMedia = realMatchMedia;
  window.localStorage.clear();
  document.documentElement.classList.remove("force-motion");
  cleanup();
  vi.restoreAllMocks();
});

describe("MotionPrompt", () => {
  it("stays hidden when the OS does not request reduced motion", () => {
    mockMedia({ [REDUCE]: false, [FINE]: true });
    renderPrompt();
    act(() => vi.advanceTimersByTime(3000));
    expect(
      screen.queryByRole("button", { name: /enable animations/i }),
    ).toBeNull();
  });

  it("stays hidden on touch-only devices", () => {
    mockMedia({ [REDUCE]: true, [FINE]: false });
    renderPrompt();
    act(() => vi.advanceTimersByTime(3000));
    expect(
      screen.queryByRole("button", { name: /enable animations/i }),
    ).toBeNull();
  });

  it("appears under reduced motion and enabling sets the force-motion override", () => {
    mockMedia({ [REDUCE]: true, [FINE]: true });
    renderPrompt();

    // Not immediate — it waits a beat so it doesn't fight first paint.
    expect(
      screen.queryByRole("button", { name: /enable animations/i }),
    ).toBeNull();
    act(() => vi.advanceTimersByTime(2600));

    const enable = screen.getByRole("button", { name: /enable animations/i });
    fireEvent.click(enable);

    expect(document.documentElement.classList.contains("force-motion")).toBe(
      true,
    );
    expect(window.localStorage.getItem("farms.motion")).toBe("on");
    // Dismissed after acting.
    expect(
      screen.queryByRole("button", { name: /enable animations/i }),
    ).toBeNull();
  });

  it("does not reappear once dismissed (persisted)", () => {
    mockMedia({ [REDUCE]: true, [FINE]: true });
    window.localStorage.setItem("farms.motionPromptDismissed", "1");
    renderPrompt();
    act(() => vi.advanceTimersByTime(3000));
    expect(
      screen.queryByRole("button", { name: /enable animations/i }),
    ).toBeNull();
  });

  it("keep-off dismisses without forcing motion", () => {
    mockMedia({ [REDUCE]: true, [FINE]: true });
    renderPrompt();
    act(() => vi.advanceTimersByTime(2600));

    fireEvent.click(screen.getByRole("button", { name: /keep off/i }));
    expect(document.documentElement.classList.contains("force-motion")).toBe(
      false,
    );
    expect(window.localStorage.getItem("farms.motionPromptDismissed")).toBe(
      "1",
    );
  });
});
