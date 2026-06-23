import { expect, test } from "@playwright/test";

test.describe("favoriting", () => {
  test("saving a farm surfaces it on the Saved page", async ({ page }) => {
    await page.goto("/");

    // Favorite the first farm card (localStorage-only — no backend writes).
    const save = page.getByRole("button", { name: /^save$/i }).first();
    await expect(save).toBeVisible();
    await save.click();

    await page.goto("/saved");
    await expect(page).toHaveURL(/\/saved$/);

    // The empty state must be gone and the "All saved" tab should count it.
    await expect(page.getByText("No saved farms yet")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /all saved/i }),
    ).toBeVisible();
  });
});
