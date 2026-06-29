import { expect, test } from "@playwright/test";

test.describe("language switcher", () => {
  test("switches the home hero copy to German and persists across reload", async ({
    page,
  }) => {
    await page.goto("/");

    // Target the hero by role (its accessible name) rather than a loose text
    // substring, which matched ambiguously under WebKit. English lead:
    // "Fresh from a farm".
    const heroEn = page.getByRole("heading", { name: /fresh from a farm/i });
    const heroDe = page.getByRole("heading", { name: /frisch vom hof/i });
    await expect(heroEn).toBeVisible();

    // Open the language menu (its trigger is labelled "Language" in English).
    await page.getByRole("button", { name: "Language" }).first().click();
    await page.getByRole("menuitemradio", { name: "Deutsch" }).click();

    // German hero lead is "Frisch vom Hof".
    await expect(heroDe).toBeVisible();
    await expect(heroEn).toHaveCount(0);

    // The choice is remembered (persisted client-side) after a reload.
    await page.reload();
    await expect(heroDe).toBeVisible();
  });
});
