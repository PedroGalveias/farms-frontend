import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isInternalHref,
  runViewTransition,
  shouldAnimateNavigation,
  shouldInterceptClick,
  type ClickContext,
} from "@/lib/view-transitions";

describe("isInternalHref", () => {
  it("accepts app-relative paths", () => {
    expect(isInternalHref("/")).toBe(true);
    expect(isInternalHref("/farm/abc")).toBe(true);
  });

  it("rejects external, protocol-relative and non-string hrefs", () => {
    expect(isInternalHref("https://example.com")).toBe(false);
    expect(isInternalHref("//cdn.example.com")).toBe(false);
    expect(isInternalHref("mailto:x@y.z")).toBe(false);
    expect(isInternalHref("#section")).toBe(false);
    expect(isInternalHref(null)).toBe(false);
    expect(isInternalHref(undefined)).toBe(false);
  });
});

describe("shouldInterceptClick", () => {
  const base: ClickContext = {
    href: "/saved",
    target: null,
    download: false,
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    currentUrl: "/",
  };

  it("intercepts a plain primary click on an internal link", () => {
    expect(shouldInterceptClick(base)).toBe(true);
  });

  it("leaves modified clicks to the browser (new tab / window)", () => {
    expect(shouldInterceptClick({ ...base, metaKey: true })).toBe(false);
    expect(shouldInterceptClick({ ...base, ctrlKey: true })).toBe(false);
    expect(shouldInterceptClick({ ...base, shiftKey: true })).toBe(false);
    expect(shouldInterceptClick({ ...base, button: 1 })).toBe(false);
  });

  it("ignores new-tab targets, downloads and already-handled events", () => {
    expect(shouldInterceptClick({ ...base, target: "_blank" })).toBe(false);
    expect(shouldInterceptClick({ ...base, download: true })).toBe(false);
    expect(shouldInterceptClick({ ...base, defaultPrevented: true })).toBe(
      false,
    );
  });

  it("ignores external links", () => {
    expect(shouldInterceptClick({ ...base, href: "https://example.com" })).toBe(
      false,
    );
  });

  it("skips a navigation to the current URL", () => {
    expect(shouldInterceptClick({ ...base, href: "/", currentUrl: "/" })).toBe(
      false,
    );
  });
});

describe("runViewTransition", () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = realMatchMedia;
    delete (document as { startViewTransition?: unknown }).startViewTransition;
  });

  it("runs the update immediately when the API is unavailable", () => {
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    const update = vi.fn();
    const el = document.createElement("div");

    runViewTransition(update, el);

    expect(update).toHaveBeenCalledTimes(1);
    // No morph name should be applied when there's no transition.
    expect(el.style.viewTransitionName).toBe("");
  });

  it("names the source before capture and clears it inside the update", () => {
    // Motion allowed + API present. jsdom has no matchMedia, so define one.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    } as unknown as MediaQueryList);

    let nameWhenUpdateRan: string | undefined;
    const el = document.createElement("div");
    const update = vi.fn(() => {
      // At this point the source is still named — the destination doesn't
      // exist yet, so the OLD snapshot has exactly one "qs-farm".
      nameWhenUpdateRan = el.style.viewTransitionName;
    });

    (document as { startViewTransition?: unknown }).startViewTransition = (
      cb: () => void,
    ) => {
      // Name must be applied *before* the callback (old-snapshot capture).
      expect(el.style.viewTransitionName).toBe("qs-farm");
      cb();
      return { finished: Promise.resolve() };
    };

    runViewTransition(update, el);

    expect(update).toHaveBeenCalledTimes(1);
    // The update saw the name…
    expect(nameWhenUpdateRan).toBe("qs-farm");
    // …and it was cleared before the NEW snapshot (no duplicate name).
    expect(el.style.viewTransitionName).toBe("");
  });
});

describe("shouldAnimateNavigation", () => {
  it("animates only when supported and motion is allowed", () => {
    expect(
      shouldAnimateNavigation({ supported: true, reducedMotion: false }),
    ).toBe(true);
    expect(
      shouldAnimateNavigation({ supported: false, reducedMotion: false }),
    ).toBe(false);
    expect(
      shouldAnimateNavigation({ supported: true, reducedMotion: true }),
    ).toBe(false);
  });
});
