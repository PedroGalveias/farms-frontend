import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOTION_EVENT,
  MOTION_STORAGE_KEY,
  motionForced,
  prefersReducedMotion,
  setMotionForced,
} from "@/lib/motion";

const realMatchMedia = window.matchMedia;

function mockReduce(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
  }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
  window.localStorage.clear();
  document.documentElement.classList.remove("force-motion");
  vi.restoreAllMocks();
});

describe("motion preference", () => {
  it("follows the OS media query by default", () => {
    mockReduce(true);
    expect(prefersReducedMotion()).toBe(true);
    mockReduce(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("forcing animations on overrides OS reduced motion", () => {
    mockReduce(true);
    setMotionForced(true);

    expect(motionForced()).toBe(true);
    expect(prefersReducedMotion()).toBe(false);
    expect(document.documentElement.classList.contains("force-motion")).toBe(
      true,
    );
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("on");
  });

  it("turning the override off restores the OS behaviour", () => {
    mockReduce(true);
    setMotionForced(true);
    setMotionForced(false);

    expect(motionForced()).toBe(false);
    expect(prefersReducedMotion()).toBe(true);
    expect(document.documentElement.classList.contains("force-motion")).toBe(
      false,
    );
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it("notifies live consumers when toggled", () => {
    mockReduce(false);
    const listener = vi.fn();
    window.addEventListener(MOTION_EVENT, listener);
    setMotionForced(true);
    setMotionForced(false);
    window.removeEventListener(MOTION_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
