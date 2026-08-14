import { expect, test } from "@playwright/test";

// The directory uses the real OpenStreetMap surface; the dotted Switzerland
// canvas belongs to quick search (covered separately in dot-map.spec.ts).
test.describe("directory OpenStreetMap view", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("renders OpenStreetMap tiles and coordinate-based farm markers", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show map/i }).click();

    const map = page.getByRole("region", { name: /map of \d+ farms/i });
    await expect(map).toBeVisible();
    await expect(map.locator(".leaflet-tile").first()).toHaveAttribute(
      "src",
      /tile\.openstreetmap\.org/,
    );
    await expect(map.getByText("OpenStreetMap")).toBeVisible();
    await expect
      .poll(() => map.locator(".farm-pin, .farm-cluster").count())
      .toBeGreaterThan(0);
  });

  test("the canton filter changes how many farms the map lights up", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show map/i }).click();
    const map = page.getByRole("region", { name: /map of \d+ farms/i });
    await expect(map).toBeVisible();

    const countOf = async () =>
      Number((await map.getAttribute("aria-label"))?.match(/\d+/)?.[0] ?? "0");
    const before = await countOf();
    expect(before).toBeGreaterThan(0);

    // Filtering to one canton must reduce the pinned result set — the map reads
    // the same filtered list as the grid.
    const bern = page.getByRole("button", { name: /^bern \d+$/i }).first();
    await bern.scrollIntoViewIfNeeded();
    await bern.click();
    await expect.poll(countOf).toBeLessThan(before);
  });

  test("opens a farm detail from its map pin", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /show map/i }).click();

    const marker = page.locator(".farm-pin").first();
    await expect(marker).toBeVisible();
    const farmName = await marker.getAttribute("title");
    expect(farmName).toBeTruthy();
    await marker.click();
    await expect(
      page.getByRole("heading", { level: 2, name: farmName! }),
    ).toBeVisible();
  });
});
