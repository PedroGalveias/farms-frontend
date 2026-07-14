import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import HapticTap from "@/components/ui/HapticTap";

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HapticTap", () => {
  it("renders nothing on non-iOS devices", async () => {
    setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/141.0");
    const { container } = render(
      <button type="button">
        save
        <HapticTap />
      </button>,
    );
    await act(async () => {});
    expect(container.querySelector("input[switch]")).toBeNull();
  });

  it("renders a real switch on iOS and lets the tap bubble to the button", async () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    const onClick = vi.fn();
    render(
      <button onClick={onClick} type="button">
        save
        <HapticTap />
      </button>,
    );
    await act(async () => {});

    const toggle = document.querySelector<HTMLInputElement>("input[switch]");
    expect(toggle).not.toBeNull();
    expect(toggle?.type).toBe("checkbox");
    // Painted (not zero opacity — that mutes the haptic), imperceptible.
    expect(Number(toggle?.style.opacity)).toBeGreaterThan(0);
    expect(Number(toggle?.style.opacity)).toBeLessThan(0.2);
    // Its wrapper is decoration for AT.
    expect(toggle?.closest("span")?.getAttribute("aria-hidden")).toBe("true");

    // The finger's tap toggles the switch natively (system haptic) AND still
    // reaches the button's own handler via bubbling.
    fireEvent.click(toggle!);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("HapticTap wide", () => {
  it("tiles multiple painted switches across a full-width row", async () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    const onClick = vi.fn();
    render(
      <button onClick={onClick} type="button">
        Save
        <HapticTap wide />
      </button>,
    );
    await act(async () => {});

    const toggles =
      document.querySelectorAll<HTMLInputElement>("input[switch]");
    // A single native switch is ~51px and can't be resized without losing
    // the haptic — coverage comes from tiling, so there must be several.
    expect(toggles.length).toBeGreaterThan(4);
    for (const toggle of toggles) {
      expect(Number(toggle.style.opacity)).toBeGreaterThan(0);
    }

    // A tap landing on ANY tile still reaches the button's handler.
    fireEvent.click(toggles[toggles.length - 1]);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
