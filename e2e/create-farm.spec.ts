import { expect, test } from "@playwright/test";

test.describe("create farm dialog", () => {
  test("opens, validates an empty submit, and closes — without posting", async ({
    page,
  }) => {
    // Guard: fail loudly if an empty/invalid submit ever hits the real backend.
    let posted = false;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/api/farms")) {
        posted = true;
      }
    });

    await page.goto("/");
    await page
      .getByRole("button", { name: /add a farm/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Submitting the empty form must surface validation and stay open.
    await dialog
      .getByRole("button", { name: "Create farm", exact: true })
      .click();
    await expect(dialog).toBeVisible();
    expect(posted).toBe(false);

    // Escape closes it.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(posted).toBe(false);
  });
});
