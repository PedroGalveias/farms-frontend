import { expect, test } from "@playwright/test";

// All auth backend calls are mocked so e2e never touches the real backend
// (no real registrations / emails). We're testing the frontend wiring.

test.describe("auth UI", () => {
  test("opens the login modal, validates, and switches to register", async ({
    page,
  }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: null } }),
    );

    await page.goto("/");
    await page
      .getByRole("button", { name: /log in/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/welcome back/i)).toBeVisible();

    // "a@b" is valid to the browser's native email check but fails ours
    // (no TLD), so our client validation surfaces a field error.
    await dialog.getByLabel(/email/i).fill("a@b");
    await dialog.getByLabel(/password/i).fill("anything");
    await dialog.getByRole("button", { name: /^log in$/i }).click();
    await expect(dialog.getByText(/valid email address/i)).toBeVisible();

    // Switch to the register form.
    await dialog.getByRole("button", { name: /create an account/i }).click();
    await expect(dialog.getByText(/create your account/i)).toBeVisible();
  });

  test("register shows the 'check your inbox' panel on success", async ({
    page,
  }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: null } }),
    );
    let registered = false;
    await page.route("**/api/auth/register", (route) => {
      registered = true;
      return route.fulfill({ status: 202, body: "" });
    });

    await page.goto("/");
    await page
      .getByRole("button", { name: /log in/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /create an account/i }).click();

    await dialog.getByLabel(/email/i).fill("new@example.com");
    await dialog
      .getByLabel("Password", { exact: true })
      .fill("a-very-long-password");
    await dialog.getByLabel(/confirm/i).fill("a-very-long-password");
    await dialog.getByRole("button", { name: /create account/i }).click();

    await expect(dialog.getByText(/check your inbox/i)).toBeVisible();
    expect(registered).toBe(true);
  });

  test("adding a farm while logged out prompts login", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: null } }),
    );

    await page.goto("/");
    await page
      .getByRole("button", { name: /add a farm/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/log in to add a farm/i)).toBeVisible();
  });

  test("verify-email confirms and shows the success state", async ({
    page,
  }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: { user: null } }),
    );
    await page.route("**/api/auth/verify-email", (route) =>
      route.fulfill({ status: 200, body: "{}" }),
    );

    await page.goto("/verify-email?token=test-token");
    await page.getByRole("button", { name: /verify my email/i }).click();

    await expect(page.getByText(/thanks for confirming/i)).toBeVisible();
    await expect(page.getByText(/your account is active/i)).toBeVisible();
  });
});
