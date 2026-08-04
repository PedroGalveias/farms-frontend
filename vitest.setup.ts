import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// LanguageProvider (and other chrome) reads the router/pathname; give every
// test an inert default so components mount without per-file boilerplate.
// Tests that assert on navigation re-mock next/navigation locally.
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
  };
});

// Cache Components' request-scope APIs only work inside a Next render. Vitest
// imports modules directly, so `cacheLife()` throws "only available with the
// cacheComponents config" and `connection()` throws "called outside a request
// scope" — neither is a failure of the code under test.
//
// The `"use cache"` directives themselves are inert here: they are compiler
// instructions, and nothing in vitest runs Next's transform. So a cached
// function under test simply executes its body, which is exactly what these
// tests assert on — the fetch it makes, the shape it adapts, the error it
// maps. Whether the result is actually cached is a build-time fact, visible in
// the route table (every route ◐) and exercised end to end.
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheLife: () => {},
  cacheTag: () => {},
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

// Production runs over HTTPS (a secure context); mirror that in jsdom so
// geolocation code under test isn't short-circuited as "insecure".
Object.defineProperty(window, "isSecureContext", {
  configurable: true,
  value: true,
});

// jsdom has no matchMedia. Default to "no match" with inert listeners so
// motion/theme hooks mount cleanly; tests that assert on a specific media
// query still replace this with their own mock.
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

// jsdom ships neither observer. Components that scroll-reveal (Intersection
// Observer) or size a canvas to their box (ResizeObserver) construct one on
// mount; give them inert no-op stubs so those effects don't throw under test.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
for (const name of ["IntersectionObserver", "ResizeObserver"] as const) {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: NoopObserver,
    });
  }
}

// jsdom implements no scrolling at all, so `scrollIntoView` is simply missing
// from Element.prototype. Any component that keeps an active item in view (the
// GlassSelect listbox, the quick-search results) would throw on render instead
// of failing on the behaviour under test. A no-op stub is the right shape: the
// tests that care about scrolling assert on the calls, and the rest are
// unaffected.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Unmount React trees and reset jsdom between tests.
afterEach(() => {
  cleanup();
});
