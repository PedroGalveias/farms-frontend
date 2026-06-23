import { expect, test } from "@playwright/test";

test.describe("language switcher", () => {
  test("switches the home hero copy to German and persists across reload", async ({
    page,
  }) => {
    await page.goto("/");

    // The English hero lead is "Fresh from a farm".
    await expect(page.getByText("Fresh from a farm")).toBeVisible();

    // Open the language menu (its trigger is labelled "Language" in English).
    await page.getByRole("button", { name: "Language" }).first().click();
    await page.getByRole("menuitemradio", { name: "Deutsch" }).click();

    // German hero lead is "Frisch vom Hof".
    await expect(page.getByText("Frisch vom Hof")).toBeVisible();
    await expect(page.getByText("Fresh from a farm")).toHaveCount(0);

    // The choice is remembered (persisted client-side) after a reload.
    await page.reload();
    await expect(page.getByText("Frisch vom Hof")).toBeVisible();
  });
});
