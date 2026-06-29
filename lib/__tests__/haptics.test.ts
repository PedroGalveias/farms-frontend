import { afterEach, describe, expect, it, vi } from "vitest";
import { haptic } from "@/lib/haptics";

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { vibrate?: unknown }).vibrate;
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
  });

  it("is a no-op when the Vibration API is unavailable", () => {
    delete (navigator as { vibrate?: unknown }).vibrate;
    expect(() => haptic()).not.toThrow();
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
});
