import { expect, test } from "@playwright/test";

// These are functional journeys, not motion checks. Reduced motion lets each
// card settle synchronously, avoiding a click against an in-flight deck slide;
// visual coverage exercises the animated presentation separately.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

// The quick-search 3-step stacked-deck flow is a hard product requirement —
// this walks it end to end: location → products → distance-sorted results →
// farm detail. All three step cards stay in the DOM (the stacked deck), so
// each is addressed by its "Step N of 3" label. Use a DOM locator rather than
// an accessibility-role lookup: while the deck changes steps, inactive cards
// are temporarily aria-hidden and WebKit can omit them from that lookup.
const stepCard = (page: import("@playwright/test").Page, n: 1 | 2 | 3) =>
  page
    .locator("article")
    .filter({ hasText: `Step ${n} of 3` })
    .first();

test.describe("quick search flow", () => {
  test("location → products → results → farm detail", async ({ page }) => {
    // Five sequential clicks through a three-card deck, each waiting on the
    // next card to settle, against a dev server compiling routes for the rest
    // of the suite in parallel. The default 30s budget is enough alone and not
    // always enough under that load: this failed once on Firefox during a full
    // run and passed 3/3 in isolation. Same treatment, and same reason, as the
    // canton-listbox test in a11y.spec.ts.
    test.slow();
    await page.goto("/quick-search");
    // A click that lands before hydration is silently lost — the element is
    // actionable but no handler is attached — and the failure then surfaces
    // several steps later. Waiting for the network to go quiet makes that
    // window much smaller.
    await page.waitForLoadState("networkidle");

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

    // Assert the primary action inside the opened farm-detail dialog, rather
    // than accepting an unrelated Maps link elsewhere on the page.
    const mapsLink = page
      .getByRole("dialog")
      .getByRole("link", { name: /open in (apple )?maps/i });
    await expect(mapsLink).toBeVisible();
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

    const results = stepCard(page, 3);
    // The seasonal path jumps directly from step 1 to 3. On WebKit, wait for
    // the foreground card rather than querying its footer during that change.
    await expect(results).toHaveAttribute("aria-hidden", "false");
    const startOver = results.getByRole("button", { name: /start over/i });
    await expect(startOver).toBeVisible();
    await startOver.click();

    await expect(
      stepCard(page, 1).getByRole("button", { name: /choose products/i }),
    ).toBeVisible();
  });
});

test.describe("search ritual", () => {
  test("type-to-filter narrows the catalog and surfaces the product", async ({
    page,
  }) => {
    await page.goto("/quick-search");
    await stepCard(page, 1)
      .getByRole("button", { name: /choose products/i })
      .click();

    const products = stepCard(page, 2);
    await products.getByPlaceholder(/try eggs, honey/i).fill("brocc");
    await expect(
      products.getByRole("button", { name: "Broccoli", exact: true }),
    ).toBeVisible();
    await expect(
      products.getByRole("button", { name: "Fruits", exact: true }),
    ).toHaveCount(0);
  });

  test("results offer hearts, a map handoff, and a resumable search", async ({
    page,
  }) => {
    await page.goto("/quick-search?products=Käse");
    await page
      .getByRole("button", { name: /show \d+ farms/i })
      .first()
      .click();

    // Save straight from a result row.
    const firstHeart = page
      .locator("li")
      .filter({ has: page.locator("h3") })
      .first()
      .getByRole("button", { name: /save|saved/i });
    await firstHeart.click();
    await expect(firstHeart).toHaveAttribute("aria-pressed", "true");

    // Map handoff carries the selection as its category group.
    const mapLink = page.getByRole("link", { name: /see these on the map/i });
    await expect(mapLink).toHaveAttribute("href", /view=map/);
    await expect(mapLink).toHaveAttribute("href", /cat=/);

    // A fresh visit offers to resume the finished search.
    await page.goto("/quick-search");
    const resume = page.getByRole("button", { name: /resume last search/i });
    await expect(resume).toBeVisible();
    await resume.click();
    await expect(
      page.getByRole("heading", { name: /farms? found/i }),
    ).toBeVisible();
  });
});
