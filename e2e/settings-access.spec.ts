import { expect, test } from "@playwright/test";

/**
 * Settings must be reachable without an account.
 *
 * The page was never auth-gated, but the only link to it used to run through
 * /profile — which the account menu offers only once you are signed in. These
 * tests run in a fresh context, so they are signed out by definition; that is
 * the whole point.
 */
test.describe("settings is reachable signed out", () => {
  test("from the desktop side rail", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const gear = page.locator('aside a[href*="/settings"]');
    await expect(gear).toBeVisible();
    await gear.click();

    await expect(page).toHaveURL(/\/settings(?:\?|$)/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // Once there, the rail says so.
    await expect(page.locator('aside a[href*="/settings"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("from the mobile header", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");

    const gear = page.locator('header a[href*="/settings"]');
    await expect(gear).toBeVisible();
    await gear.click();

    await expect(page).toHaveURL(/\/settings(?:\?|$)/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("the entry carries an accessible name in every locale", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [path, label] of [
      ["/", "Settings"],
      ["/de", "Einstellungen"],
      ["/fr", "Réglages"],
    ] as const) {
      await page.goto(path);
      await expect(page.locator('aside a[href*="/settings"]')).toHaveAttribute(
        "title",
        label,
      );
    }
  });

  test("does not overflow the header pill on a 320px phone", async ({
    page,
  }) => {
    // The narrowest phones still in use. Four utilities plus the brand
    // wordmark used to push the gear outside the pill and scroll the page
    // sideways; the wordmark now gives way instead.
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto("/");

    const gear = page.locator('header a[href*="/settings"]');
    const pill = page.locator("header > div").first();
    const gearBox = await gear.boundingBox();
    const pillBox = await pill.boundingBox();

    expect(gearBox).not.toBeNull();
    expect(pillBox).not.toBeNull();
    expect(gearBox!.x + gearBox!.width).toBeLessThanOrEqual(
      pillBox!.x + pillBox!.width + 1,
    );

    // A control small enough to fit is no good if it cannot be tapped.
    expect(gearBox!.width).toBeGreaterThanOrEqual(40);
    expect(gearBox!.height).toBeGreaterThanOrEqual(40);

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("the bottom tab bar is left alone", async ({ page }) => {
    // Settings deliberately did not go here: this bar hides itself on scroll
    // and goes inert, so a control placed in it is intermittently unreachable.
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/");

    const tabBar = page.locator('nav[aria-label="Primary"]:visible');
    await expect(tabBar.locator("a")).toHaveCount(3);
    await expect(tabBar.locator('a[href$="/settings"]')).toHaveCount(0);
  });
});
