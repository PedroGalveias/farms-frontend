import { expect, test } from "@playwright/test";

test.describe("directory layout", () => {
  test("the result summary scrolls with the farm cards", async ({ page }) => {
    await page.goto("/");

    const summary = page.getByRole("heading", { name: /^\d+ farms$/i });
    await summary.scrollIntoViewIfNeeded();

    const before = await summary.boundingBox();
    expect(before).not.toBeNull();

    await page.evaluate(() => window.scrollBy(0, 320));

    await expect
      .poll(
        async () =>
          (await summary.boundingBox())?.y ?? Number.POSITIVE_INFINITY,
      )
      .toBeLessThan((before?.y ?? 0) - 200);
  });
});
