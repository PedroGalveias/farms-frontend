import { expect, test } from "@playwright/test";

// i18n is a hard product requirement (5 locales, client-side). This verifies
// the runtime language switch actually re-renders copy and persists.
test.describe("language switching", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("switching to German re-renders the hero and persists across reload", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Fresh from a farm/i,
    );

    // Open the language menu (globe) in the desktop rail and pick Deutsch.
    await page
      .getByRole("button", { name: /language/i })
      .first()
      .click();
    await page.getByRole("menuitemradio", { name: "Deutsch" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Frisch vom Hof/i,
    );
    // The switch is a navigation: German lives at /de.
    await expect(page).toHaveURL(/\/de(\/|$)/);

    // Persisted: a reload keeps German.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Frisch vom Hof/i,
    );
  });
});
