import { expect, test } from "@playwright/test";

// Desktop behaviours that regressed on device: the docked farm panel must
// overlay (not reflow) the list and be visibly painted immediately; the
// canton rail must filter in place; back-to-top must float mid-scroll.
// Role-based selectors + .first() throughout: streamed content briefly
// exists twice in the DOM (hidden template + destination).
test.describe("desktop master–detail & directory interactions", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opening a farm docks a painted panel without reflowing the grid", async ({
    page,
  }) => {
    await page.goto("/");
    const firstCard = page.getByRole("article").first();
    await expect(firstCard).toBeVisible();

    const grid = () =>
      page
        .getByRole("article")
        .first()
        .locator("xpath=ancestor::div[contains(@class,'grid')]")
        .first();
    const gridWidthBefore = await grid().evaluate(
      (el) => el.getBoundingClientRect().width,
    );

    // Click the card's open control (the transparent full-card overlay
    // button) — geometric article-center clicks race the reveal transition
    // on Firefox.
    await firstCard.getByRole("button", { name: /view details/i }).click();

    const dock = page.locator(".qs-dock");
    await expect(dock).toBeVisible();

    // Painted immediately — a near-transparent background was the reported
    // "renders half a second later" bug (the panel used to open inside a
    // View Transition that hid it behind snapshots).
    const alpha = await dock.evaluate((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgba?\(([^)]+)\)/);
      const parts = match ? match[1].split(",").map(parseFloat) : [];
      return parts.length === 4 ? parts[3] : 1;
    });
    expect(alpha).toBeGreaterThan(0.2);

    // The list keeps its shape — the dock floats on its own layer.
    const gridWidthAfter = await grid().evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    expect(gridWidthAfter).toBe(gridWidthBefore);

    // Non-modal: the panel closes and the list is still there.
    await dock.getByRole("button", { name: /close/i }).click();
    await expect(dock).toHaveCount(0);
    await expect(page.getByRole("article").first()).toBeVisible();
  });

  test("canton rail filters the directory in place and syncs the toolbar", async ({
    page,
  }) => {
    await page.goto("/");
    const bernChip = page.getByRole("button", { name: /^bern \d+$/i }).first();
    await bernChip.scrollIntoViewIfNeeded();
    await bernChip.click();

    await expect(bernChip).toHaveAttribute("aria-pressed", "true");
    // Toolbar select mirrors the rail selection.
    await expect(page.locator("select").first()).toHaveValue("BE");
    // A second tap clears the filter again.
    await bernChip.click();
    await expect(bernChip).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("select").first()).toHaveValue("all");
  });

  test("back-to-top floats mid-scroll and returns to the top", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("article").first()).toBeVisible();
    // scrollTo fires the same window scroll events the listener consumes
    // (mouse.wheel is a no-op on headless Firefox).
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForFunction(() => window.scrollY > 1000);

    const backToTop = page.getByRole("button", { name: /back to top/i });
    await expect(backToTop).toBeVisible();
    const { position, inViewport } = await backToTop.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        position: getComputedStyle(el).position,
        inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
      };
    });
    expect(position).toBe("fixed");
    expect(inViewport).toBe(true);

    await backToTop.click();
    await page.waitForFunction(() => window.scrollY < 50);
  });
});
