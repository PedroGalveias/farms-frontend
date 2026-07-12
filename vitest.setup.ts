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

// Unmount React trees and reset jsdom between tests.
afterEach(() => {
  cleanup();
});
