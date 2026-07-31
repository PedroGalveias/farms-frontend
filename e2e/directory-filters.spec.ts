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

    // The control reporting "All cantons" is not the same as the LIST being
    // restored — a reset that updates the label but leaves the results filtered
    // would sail past the assertions above. Check the count comes back.
    await expect
      .poll(async () =>
        Number((await heading.textContent())?.match(/\d+/)?.[0] ?? "0"),
      )
      .toBe(initial);
  });

  // A shared "within 25 km" link used to empty the directory for every
  // recipient who hadn't shared their location: without an origin each farm's
  // distance is null, and a null distance can never satisfy a real radius. The
  // radius control only renders while location is active, so nothing on screen
  // explained it or offered a way back.
  test("a shared ?radius= link still shows farms without a stored location", async ({
    page,
  }) => {
    await page.goto("/?radius=25");
    await expect(page.getByRole("article").first()).toBeVisible();
    expect(await page.getByRole("article").count()).toBeGreaterThan(0);
    // The inert radius is dropped from the URL rather than shared onward.
    await expect
      .poll(() => new URL(page.url()).searchParams.get("radius"))
      .toBeNull();
  });
});
