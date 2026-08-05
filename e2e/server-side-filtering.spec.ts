import { expect, test, type Page } from "@playwright/test";

/**
 * The directory now asks the API for a filtered subset instead of downloading
 * every farm and filtering locally.
 *
 * The failure this guards against is specific and was the reason the change sat
 * blocked for weeks: the filter picker used to derive its options from the
 * farms it was handed, so the moment the server returned only Bern's farms the
 * canton dropdown offered only Bern — and a visitor could not get back out.
 * Counts now come from `GET /facets`, which always sees the whole directory.
 */

/**
 * The rendered card count is capped by pagination, so it is the same on every
 * URL and proves nothing. The reported total is what moves.
 *
 * Polled rather than read once. The route is partially prerendered: the shell
 * arrives as static HTML and the directory — the total with it — streams in
 * behind its Suspense boundary. `networkidle` says the network went quiet, not
 * that React has committed the streamed content, so a single innerText can
 * catch a placeholder. Waiting for a number greater than zero waits for the
 * real value; every caller here asserts on a positive total anyway.
 */
async function reportedTotal(page: Page, url: string): Promise<number> {
  await page.goto(url);

  let total = 0;
  await expect(async () => {
    const text = await page
      .getByText(/\d+\s+farms/i)
      .first()
      .innerText();
    total = Number(text.match(/\d+/)?.[0] ?? 0);
    expect(total).toBeGreaterThan(0);
  }).toPass({ timeout: 15_000 });

  return total;
}

test.describe("server-side directory filtering", () => {
  test("a canton-filtered URL still offers every other canton", async ({
    page,
  }) => {
    await page.goto("/?canton=BE");
    await page.waitForLoadState("networkidle");

    const trigger = page.getByRole("button", { name: "Canton", exact: true });
    await expect(async () => {
      if ((await trigger.getAttribute("aria-expanded")) !== "true") {
        await trigger.click();
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "true", {
        timeout: 1000,
      });
    }).toPass({ timeout: 15_000 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // The whole point. If the options were derived from the filtered list this
    // would be 1 (Bern, or Bern plus "all") and the filter would be a one-way
    // door.
    const options = listbox.getByRole("option");
    expect(await options.count()).toBeGreaterThan(3);

    // And specifically: a canton the visitor did NOT filter to is still there.
    await expect(
      listbox.getByRole("option", { name: /Z(ü|u)rich|ZH/i }).first(),
    ).toBeVisible();
  });

  test("a filtered URL reports fewer farms than the unfiltered one", async ({
    page,
  }) => {
    const all = await reportedTotal(page, "/");
    const bern = await reportedTotal(page, "/?canton=BE");

    // Proves the filter reached the server AND that the client did not undo it.
    expect(bern).toBeLessThan(all);
  });

  test("clearing the filter restores the full directory", async ({ page }) => {
    const bern = await reportedTotal(page, "/?canton=BE");
    const all = await reportedTotal(page, "/");

    // The round trip out of a filter is what a broken picker would make
    // impossible.
    expect(all).toBeGreaterThan(bern);
  });
});
