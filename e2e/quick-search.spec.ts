import { expect, test } from "@playwright/test";

// The quick-search 3-step stacked-deck flow is a hard product requirement —
// this walks it end to end: location → products → distance-sorted results →
// farm detail. All three step cards stay in the DOM (the stacked deck), so
// each is addressed by its "Step N of 3" label; inactive cards have
// pointer-events: none, which also guards against clicking the wrong one.
const stepCard = (page: import("@playwright/test").Page, n: 1 | 2 | 3) =>
  page
    .getByRole("article")
    .filter({ hasText: `Step ${n} of 3` })
    .first();

test.describe("quick search flow", () => {
  test("location → products → results → farm detail", async ({ page }) => {
    await page.goto("/quick-search");

    // Step 1 — location: pick a canton chip instead of geolocation.
    const location = stepCard(page, 1);
    await expect(location).toBeVisible();
    await location.getByRole("button", { name: /bern/i }).first().click();
    await location.getByRole("button", { name: /choose products/i }).click();

    // Step 2 — products: toggle the first product group.
    const products = stepCard(page, 2);
    const productToggle = products
      .locator('[class*="glass-card"] button[aria-pressed="false"]')
      .first();
    await expect(productToggle).toBeVisible();
    await productToggle.click();

    const showResults = products.getByRole("button", {
      name: /show \d+ farm|view results/i,
    });
    await expect(showResults).toBeEnabled();
    await showResults.click();

    // Step 3 — results: distance-sorted list of matching farms.
    const results = stepCard(page, 3);
    const firstResult = results.locator("button.glass-interactive").first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Farm detail sheet/panel opens with its primary action.
    await expect(
      page.getByRole("link", { name: /open in maps/i }).first(),
    ).toBeVisible();
  });

  test("a seasonal deep link preselects products and start over resets", async ({
    page,
  }) => {
    // Product keys are the German canonical names (what the seasonal
    // calendar links actually emit) — "Erdbeeren", not "strawberries".
    await page.goto("/quick-search?products=Erdbeeren&match=any");

    // Deep link with a product preselected: the location step offers results
    // directly. Continue, then start over.
    const location = stepCard(page, 1);
    await location
      .getByRole("button", { name: /show \d+ farm|view results/i })
      .click();

    await stepCard(page, 3)
      .getByRole("button", { name: /start over/i })
      .click();

    await expect(
      stepCard(page, 1).getByRole("button", { name: /choose products/i }),
    ).toBeVisible();
  });
});
