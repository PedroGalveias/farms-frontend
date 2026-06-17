import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the hero and primary calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /fresh from a farm/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start quick search/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add a farm/i }).first(),
    ).toBeVisible();
  });

  test("shows the seasonal produce card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/in season now/i)).toBeVisible();
  });

  test("toggles dark mode", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    await page.getByRole("switch", { name: /toggle dark mode/i }).click();
    await expect(html).toHaveClass(/dark/);
  });
});

test("navigates to the quick-search experience", async ({ page }) => {
  await page.goto("/quick-search");
  await expect(page).toHaveURL(/\/quick-search$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({ ok: true, service: "farm-frontend" });
});
