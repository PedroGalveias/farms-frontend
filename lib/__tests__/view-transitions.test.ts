import { describe, expect, it } from "vitest";
import {
  isInternalHref,
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
