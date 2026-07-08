import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import SwissFlagGlass from "@/components/hero/SwissFlagGlass";

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

afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

describe("SwissFlagGlass", () => {
  it("falls back to a crisp SVG flag when WebGL is unavailable", async () => {
    mockMedia({});
    // jsdom has no WebGL context, so the component drops to the SVG fallback.
    const { container } = render(<SwissFlagGlass className="h-full w-full" />);
    await act(async () => {});
    await act(async () => {});
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // Red field + a white cross (two arms).
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThanOrEqual(3);
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is always decorative (aria-hidden)", async () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true });
    const { container } = render(<SwissFlagGlass />);
    await act(async () => {});
    const el = container.firstElementChild;
    expect(el?.getAttribute("aria-hidden")).toBe("true");
  });
});
