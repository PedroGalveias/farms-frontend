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
    // .first() rides out a brief hydration-time duplicate of this label (the
    // SSR markup has exactly one; a second appears transiently on the client).
    await expect(page.getByText(/in season now/i).first()).toBeVisible();
  });

  test("toggles dark mode", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Desktop renders both the visible side rail and the mobile-only header;
    // scope the locator to the visible desktop chrome rather than relying on a
    // global role query to stay unique.
    const themeToggle = page
      .getByRole("complementary")
      .getByRole("switch", { name: /toggle dark mode/i });
    // The initial document is server-rendered. Retry until React has hydrated
    // the toggle instead of dispatching the click into inert SSR markup.
    await expect(async () => {
      await themeToggle.click({ timeout: 1_000 });
      await expect(themeToggle).toHaveAttribute("aria-checked", "true");
    }).toPass({ timeout: 15_000 });
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
