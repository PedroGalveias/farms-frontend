import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import AmbientBackdrop from "@/components/hero/AmbientBackdrop";

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

const FINE = "(hover: hover) and (pointer: fine)";

afterEach(() => {
  window.matchMedia = realMatchMedia;
  document.documentElement.classList.remove("has-ambient");
  vi.restoreAllMocks();
});

describe("AmbientBackdrop", () => {
  it("renders nothing on touch-only devices (CSS orbs stay)", async () => {
    mockMedia({}); // no fine pointer
    const { container } = render(<AmbientBackdrop />);
    await act(async () => {});
    expect(container.querySelector("canvas")).toBeNull();
    expect(document.documentElement.classList.contains("has-ambient")).toBe(
      false,
    );
  });

  it("renders nothing under reduced motion", async () => {
    mockMedia({ [FINE]: true, "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<AmbientBackdrop />);
    await act(async () => {});
    expect(container.querySelector("canvas")).toBeNull();
    expect(document.documentElement.classList.contains("has-ambient")).toBe(
      false,
    );
  });

  it("falls back to the CSS orbs when WebGL is unavailable", async () => {
    mockMedia({ [FINE]: true });
    // jsdom has no WebGL: getContext returns null, like Brave with shields.
    const { container } = render(<AmbientBackdrop />);
    await act(async () => {});
    await act(async () => {});
    expect(container.querySelector("canvas")).toBeNull();
    expect(document.documentElement.classList.contains("has-ambient")).toBe(
      false,
    );
  });
});
