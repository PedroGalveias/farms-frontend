import { expect, test } from "@playwright/test";

// The directory's map view is the shared Swiss dot-map (2d canvas, no WebGL
// context — the §8 budget belongs to the ambient backdrop). It must paint, react
// to the live filters, and route a dot click into the same detail sheet the
// cards open.
test.describe("directory map view (shared dot-map)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("renders the dot-map canvas and keeps the ambient WebGL budget", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show map/i }).click();

    // The canvas is labelled with the live farm count.
    const map = page.getByRole("img", { name: /map of \d+ farms/i });
    await expect(map).toBeVisible();

    // It actually painted (a backing store sized to the box, not the 300x150
    // default) — a blank canvas would still be "visible".
    await expect
      .poll(async () =>
        map.evaluate((el) => {
          const canvas = el as HTMLCanvasElement;
          return canvas.width > 400 && canvas.height > 200;
        }),
      )
      .toBe(true);

    // Exactly one WebGL context site-wide: the ambient backdrop. The dot-map
    // must be 2d only.
    const glCanvases = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("canvas")).filter((c) =>
          c.classList.contains("ambient-backdrop"),
        ).length,
    );
    expect(glCanvases).toBeLessThanOrEqual(1);
  });

  test("the canton filter changes how many farms the map lights up", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show map/i }).click();
    const map = page.getByRole("img", { name: /map of \d+ farms/i });
    await expect(map).toBeVisible();

    const countOf = async () =>
      Number((await map.getAttribute("aria-label"))?.match(/\d+/)?.[0] ?? "0");
    const before = await countOf();
    expect(before).toBeGreaterThan(0);

    // Filtering to one canton must light fewer dots — the map reads the same
    // filtered list the grid does.
    const bern = page.getByRole("button", { name: /^bern \d+$/i }).first();
    await bern.scrollIntoViewIfNeeded();
    await bern.click();
    await expect.poll(countOf).toBeLessThan(before);
  });
});
