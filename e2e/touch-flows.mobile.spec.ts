import { expect, test } from "@playwright/test";

// Phone-only flows, run on iPhone 14 (WebKit) + Pixel 7 (Blink) via the mobile
// projects. The desktop suite can't cover these: the bottom tab bar, the farm
// detail sheet, safe-area chrome, and touch scrolling only exist below `lg`.

test.describe("mobile chrome & navigation", () => {
  test("the bottom tab bar is visible and navigates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The desktop side rail is hidden; the mobile tab bar takes over.
    const tabBar = page.locator(".mobile-tab-bar");
    await expect(tabBar).toBeVisible();

    // A tab deep-links (search → quick-search). Grab the first tab that goes
    // to /quick-search and tap it.
    const searchTab = tabBar.getByRole("link").filter({ hasText: /search/i });
    if (await searchTab.count()) {
      await searchTab.first().tap();
      await expect(page).toHaveURL(/quick-search/);
    }
  });

  test("no horizontal overflow at phone width", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("opening a farm shows the detail sheet, and it dismisses", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Each farm card carries a full-bleed "View details: <name>" overlay button.
    const openCard = page
      .getByRole("button", { name: /view details:/i })
      .first();
    await openCard.scrollIntoViewIfNeeded();
    await openCard.tap();

    // The shared detail sheet is a modal dialog.
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Dismiss via the sheet's close control (backdrop or close button).
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });
});

test.describe("mobile theme", () => {
  test("respects the dark color scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(isDark).toBe(true);
  });
});
