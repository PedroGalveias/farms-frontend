import { afterEach, describe, expect, it, vi } from "vitest";
import { haptic, isIosLike } from "@/lib/haptics";

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { vibrate?: unknown }).vibrate;
  // Remove any hidden iOS switch left behind by a test.
  document.querySelectorAll("input[switch]").forEach((el) => el.remove());
});

describe("haptic", () => {
  it("calls navigator.vibrate with the given duration when supported", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
    });
    haptic();
    expect(vibrate).toHaveBeenCalledWith(10);
    haptic(25);
    expect(vibrate).toHaveBeenCalledWith(25);
    // No iOS fallback element when vibrate works.
    expect(document.querySelector("input[switch]")).toBeNull();
  });

  it("swallows errors thrown by a blocked vibration policy", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: () => {
        throw new Error("blocked");
      },
      configurable: true,
    });
    expect(() => haptic()).not.toThrow();
  });

  it("falls back to clicking a hidden switch control on iOS", () => {
    delete (navigator as { vibrate?: unknown }).vibrate;
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    const click = vi.spyOn(HTMLInputElement.prototype, "click");

    haptic();

    const toggle = document.querySelector<HTMLInputElement>("input[switch]");
    expect(toggle).not.toBeNull();
    expect(toggle?.type).toBe("checkbox");
    // The control is wrapped in an aria-hidden label that stays IN-viewport
    // at its natural size (WebKit mutes the haptic for display:none, zero
    // opacity, off-screen AND clipped-to-1px controls — it must genuinely
    // paint), at near-zero-but-not-zero opacity behind the content stack.
    const label = toggle?.closest("label");
    expect(label?.getAttribute("aria-hidden")).toBe("true");
    expect(label?.style.display).not.toBe("none");
    expect(label?.style.overflow).not.toBe("hidden");
    expect(Number(label?.style.opacity)).toBeGreaterThan(0);
    expect(label?.style.left).toBe("0px");
    expect(label?.style.bottom).toBe("0px");
    // We click the switch input itself.
    expect(click).toHaveBeenCalledTimes(1);

    // Repeated taps reuse the same hidden control.
    haptic();
    expect(document.querySelectorAll("input[switch]")).toHaveLength(1);
    expect(click).toHaveBeenCalledTimes(2);
  });

  it("is a no-op on non-iOS platforms without the Vibration API", () => {
    delete (navigator as { vibrate?: unknown }).vibrate;
    setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/141.0");
    const click = vi.spyOn(HTMLInputElement.prototype, "click");

    expect(() => haptic()).not.toThrow();
    expect(document.querySelector("input[switch]")).toBeNull();
    expect(click).not.toHaveBeenCalled();
  });
});

describe("isIosLike", () => {
  it("detects iPhone/iPad user agents", () => {
    expect(isIosLike({ userAgent: "… iPhone …" })).toBe(true);
    expect(isIosLike({ userAgent: "… iPad …" })).toBe(true);
  });

  it("detects iPadOS masquerading as macOS via touch points", () => {
    expect(isIosLike({ userAgent: "… Macintosh …", maxTouchPoints: 5 })).toBe(
      true,
    );
    expect(isIosLike({ userAgent: "… Macintosh …", maxTouchPoints: 0 })).toBe(
      false,
    );
  });

  it("is false for Windows/Android", () => {
    expect(isIosLike({ userAgent: "… Windows NT 10.0 …" })).toBe(false);
    expect(isIosLike({ userAgent: "… Linux; Android 15 …" })).toBe(false);
  });
});
