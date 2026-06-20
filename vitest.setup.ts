import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Production runs over HTTPS (a secure context); mirror that in jsdom so
// geolocation code under test isn't short-circuited as "insecure".
Object.defineProperty(window, "isSecureContext", {
  configurable: true,
  value: true,
});

// Unmount React trees and reset jsdom between tests.
afterEach(() => {
  cleanup();
});
