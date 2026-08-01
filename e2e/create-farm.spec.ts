import { expect, test } from "@playwright/test";

test.describe("create farm dialog", () => {
  test("opens, validates an empty submit, and closes — without posting", async ({
    page,
  }) => {
    // Adding a farm now requires login, so present an authenticated session.
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: { user_id: "u1", role: "user" } } }),
    );

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

  test("traps focus in the dialog and returns it to the trigger on close", async ({
    page,
  }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: { user_id: "u1", role: "user" } } }),
    );

    await page.goto("/");
    // Wait for AuthProvider's asynchronous /me hydration so Enter exercises
    // the Create Farm dialog, not the logged-out authentication prompt.
    await expect(
      page.getByRole("button", { name: "Account", exact: true }).first(),
    ).toBeVisible();
    const trigger = page.getByRole("button", { name: /add a farm/i }).first();
    await trigger.focus();
    // Safari intentionally does not focus buttons when they are mouse-clicked.
    // Open this keyboard-flow test with Enter so the prior focus is meaningful
    // across every engine, then prove the modal gives it back on Escape.
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    const close = dialog.getByRole("button", {
      name: "Close create farm dialog",
    });
    const submit = dialog.getByRole("button", {
      name: "Create farm",
      exact: true,
    });
    await expect(close).toBeFocused();

    // The close control is first in tab order. Reverse-tab from it must wrap
    // to the submit control, never into the page hidden behind the modal.
    await page.keyboard.press("Shift+Tab");
    await expect(submit).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
