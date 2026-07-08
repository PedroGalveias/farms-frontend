import { expect, test } from "@playwright/test";

// Visual regression net. Runs under OS reduced-motion so every page is
// deterministic: reveals render instantly, the marquee holds still, the
// ambient WebGL canvas yields to the static CSS orbs, count-ups show final
// values. The seasonal month card changes monthly, so it's masked.
//
// Baselines are generated on macOS (`npx playwright test visual
// --update-snapshots`) and committed; CI runs Linux, whose font rendering
// differs pixel-by-pixel, so the spec is skipped there until Linux baselines
// are added via a CI artifact run.
test.skip(
  !!process.env.CI,
  "visual baselines are macOS-rendered; generate linux baselines to enable in CI",
);
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "one engine is enough for layout regressions; three sets of baselines triple the noise",
);

test.use({ viewport: { width: 1440, height: 900 } });

// Runtime emulation (this Playwright version has no `reducedMotion` test
// option — the runner silently ignores unknown use() keys); the page-level
// API works in every engine.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

const mask = (page: import("@playwright/test").Page) => [
  // Month-driven seasonal content — mask ONLY the seasonal card, not the
  // whole hero+bento <section> that contains it (the earlier `section:has`
  // selector masked the entire hero, so the Matterhorn was never checked).
  page
    .getByText(/in season now/i)
    .locator("xpath=ancestor::div[contains(@class,'glass-card')][1]"),
];

test.describe("visual", () => {
  test("home (light)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-light.png", {
      fullPage: false,
      mask: mask(page),
    });
  });

  test("home (dark)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-dark.png", {
      mask: mask(page),
    });
  });

  test("directory list view", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /show list layout/i })
      .first()
      .click();
    const heading = page.getByRole("heading", { name: /\d+ farms/i });
    await heading.scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot("directory-list.png");
  });

  test("quick search deck", async ({ page }) => {
    await page.goto("/quick-search");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("quick-search.png");
  });

  test("canton page", async ({ page }) => {
    await page.goto("/canton/be");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("canton-be.png");
  });

  test("login modal", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /log in/i })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("auth-login.png");
  });

  test("farm detail page", async ({ page }) => {
    await page.goto("/farm/11111111-1111-4111-8111-111111111111");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("farm-detail.png", {
      // The map tiles load asynchronously and aren't layout-relevant.
      mask: [page.locator(".leaflet-container")],
    });
  });

  test("saved page (empty state)", async ({ page }) => {
    await page.goto("/saved");
    await expect(page.getByText(/no saved farms yet/i)).toBeVisible();
    await expect(page).toHaveScreenshot("saved-empty.png");
  });

  test("region page", async ({ page }) => {
    await page.goto("/region/region_mittelland");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("region-mittelland.png");
  });
});

test.describe("visual (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home mobile (light)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-mobile-light.png", {
      mask: mask(page),
    });
  });

  test("home mobile (dark)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-mobile-dark.png", {
      mask: mask(page),
    });
  });
});
