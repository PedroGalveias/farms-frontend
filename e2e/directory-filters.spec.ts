import { expect, test } from "@playwright/test";

// Functional/integration coverage of the directory's core job: search,
// view-mode switching, canton filter, and reset all working together against
// the live (mocked) farm list.
test.describe("directory filtering", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("search narrows the results and reset restores them", async ({
    page,
  }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /\d+ farms/i });
    await heading.scrollIntoViewIfNeeded();
    const initial = Number(
      (await heading.textContent())?.match(/\d+/)?.[0] ?? "0",
    );
    expect(initial).toBeGreaterThan(1);

    // The mock backend has a "Berghof Studer".
    const search = page.getByRole("combobox", { name: /search/i }).first();
    await search.fill("Berghof");
    await expect
      .poll(async () =>
        Number((await heading.textContent())?.match(/\d+/)?.[0] ?? "0"),
      )
      .toBeLessThan(initial);
    await expect(
      page.getByRole("heading", { name: /Berghof Studer/i }),
    ).toBeVisible();

    // Clearing the term restores the full list.
    await search.fill("");
    await expect
      .poll(async () =>
        Number((await heading.textContent())?.match(/\d+/)?.[0] ?? "0"),
      )
      .toBe(initial);
  });

  test("switching to list view renders compact rows", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show list layout/i }).click();
    const card = page.getByRole("article").first();
    await card.scrollIntoViewIfNeeded();
    const height = await card.evaluate(
      (el) => el.getBoundingClientRect().height,
    );
    // Compact rows are far shorter than the extended grid cards (~245px).
    expect(height).toBeLessThan(120);
  });

  test("the canton rail filters the list and the toolbar reset clears it", async ({
    page,
  }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /\d+ farms/i });
    const initial = Number(
      (await heading.textContent())?.match(/\d+/)?.[0] ?? "0",
    );

    const chip = page.getByRole("button", { name: /^bern \d+$/i }).first();
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    // The toolbar's canton control is a styled GlassSelect listbox (not a
    // native <select> any more); its trigger mirrors the rail selection.
    const cantonControl = page.getByRole("button", {
      name: "Canton",
      exact: true,
    });
    await expect(cantonControl).toContainText("Bern");
    await expect
      .poll(async () =>
        Number((await heading.textContent())?.match(/\d+/)?.[0] ?? "0"),
      )
      .toBeLessThanOrEqual(initial);

    // Reset via the toolbar control back to all cantons: open the listbox and
    // pick "All cantons".
    await cantonControl.click();
    await page.getByRole("option", { name: /all cantons/i }).click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await expect(cantonControl).toContainText(/all cantons/i);
  });
});
