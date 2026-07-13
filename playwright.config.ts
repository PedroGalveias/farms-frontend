import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
// The app fetches the farm list server-side, so we can't mock it from the
// browser. Instead we run a local stand-in backend and point the app at it,
// making the suite deterministic and independent of the (cold-start-prone)
// free-tier Render backend. See e2e/mock-backend.mjs.
const MOCK_BACKEND_PORT = 4319;
const mockBackendUrl = `http://127.0.0.1:${MOCK_BACKEND_PORT}`;

// E2E smoke tests run against a production build of the app, started by the
// webServer block below. Mirrors the backend's "test against the real thing"
// approach (the frontend's analog of a live server, minus the backend DB).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Three engines triple the test count against a single dev server; cap the
  // concurrency so page loads stay fast and don't flake under contention.
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Run every engine — Blink, Gecko, and WebKit — because the product must feel
  // equally premium on Chromium, Firefox, and Safari. A Chromium-only suite
  // would hide engine-specific regressions (WebKit especially).
  // Phone flows live in *.mobile.spec.ts and run ONLY on the mobile projects;
  // the desktop engines skip them (and everything else runs desktop-only).
  projects: [
    // Desktop engines: Blink, Gecko, WebKit.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.mobile\.spec\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /\.mobile\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /\.mobile\.spec\.ts/,
    },
    // Mobile emulation — the product is mobile-first, so the touch flows
    // (tab bar, sheets, safe-area chrome) run on phone viewports with a coarse
    // pointer. iOS Safari (WebKit) + Android Chrome (Blink).
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
      testMatch: /\.mobile\.spec\.ts/,
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /\.mobile\.spec\.ts/,
    },
  ],
  // Two servers: the local mock backend (started first so it's serving before
  // the app build's server-side fetches run), then the app pointed at it via
  // FARMS_API_BASE_URL.
  webServer: [
    {
      command: `node e2e/mock-backend.mjs`,
      url: `${mockBackendUrl}/health_check`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_BACKEND_PORT: String(MOCK_BACKEND_PORT) },
      timeout: 30_000,
    },
    {
      command: "npm run build && npm run start",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      env: { FARMS_API_BASE_URL: mockBackendUrl },
      timeout: 120_000,
    },
  ],
});
