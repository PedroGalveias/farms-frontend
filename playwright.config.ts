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
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
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
