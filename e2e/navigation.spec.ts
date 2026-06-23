import { expect, test } from "@playwright/test";

test.describe("routes & navigation", () => {
  test("saved page shows the empty state on a fresh visit", async ({
    page,
  }) => {
    await page.goto("/saved");
    await expect(page).toHaveURL(/\/saved$/);
    // No favorites in a fresh browser context — the empty state should show.
    await expect(page.getByText("No saved farms yet")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse/i }).first(),
    ).toBeVisible();
  });

  test("seasonal page renders its heading", async ({ page }) => {
    await page.goto("/seasonal");
    await expect(page).toHaveURL(/\/seasonal$/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("an unknown route renders the 404 with a go-back control", async ({
    page,
  }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/off the map/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });

  test("an unknown farm id renders the 404", async ({ page }) => {
    // A bogus id finds no matching farm, so the page calls notFound() and the
    // app's 404 boundary renders. (Assert on content — the HTTP status differs
    // between the dev server and a production build.)
    await page.goto("/farm/does-not-exist-123");
    await expect(page.getByText(/off the map/i)).toBeVisible();
  });
});
