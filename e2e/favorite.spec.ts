import { expect, test } from "@playwright/test";

test.describe("favoriting", () => {
  test("saving a farm surfaces it on the Saved page", async ({ page }) => {
    await page.goto("/");

    // Favorite the first farm card (localStorage-only — no backend writes).
    // The accessible name flips Save → Saved on click, so a /^save$/ locator
    // would silently RE-RESOLVE to the next unsaved button after clicking —
    // that moving target was this spec's long-standing "flake". Match both
    // states so the locator stays pinned to the same physical button.
    const save = page.getByRole("button", { name: /^saved?$/i }).first();
    await expect(save).toBeVisible();
    // Arriving at the heart hovers the card, which lifts (500ms transition) —
    // clicking during the lift can land 6px off target on WebKit. Hover
    // first and let the card settle.
    await save.hover();
    await page.waitForTimeout(600);
    await save.click();
    // Wait for the persisted write before navigating — a full navigation can
    // race the localStorage flush and land on an empty Saved page.
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await page.waitForFunction(() => {
      try {
        return (
          JSON.parse(window.localStorage.getItem("farms.favorites") ?? "[]")
            .length > 0
        );
      } catch {
        return false;
      }
    });

    await page.goto("/saved");
    await expect(page).toHaveURL(/\/saved$/);

    // The empty state must be gone and the "All saved" tab should count it.
    await expect(page.getByText("No saved farms yet")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /all saved/i }),
    ).toBeVisible();
  });
});
