import { expect, test } from "@playwright/test";

// The home route is partially prerendered: the static shell carries the chrome
// and a skeleton, and the hero streams in behind the page's Suspense boundary
// with the directory it reads from. So "the hero is visible" is no longer true
// the moment the document lands — it waits on a render the server is still
// flushing. Playwright's 5s default was enough when the whole page arrived
// server-rendered in one piece; on the slowest CI runner (Windows) it is not.
//
// The budget is the fix rather than a poll: the assertions below are already
// the right ones, they just have to outlast a stream.
const streamed = { timeout: 20_000 };

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
    await expect(heroEn).toBeVisible(streamed);

    // Open the language menu (its trigger is labelled "Language" in English).
    await page.getByRole("button", { name: "Language" }).first().click();
    await page.getByRole("menuitemradio", { name: "Deutsch" }).click();

    // German hero lead is "Frisch vom Hof".
    await expect(heroDe).toBeVisible(streamed);
    await expect(heroEn).toHaveCount(0, streamed);

    // The choice is remembered (persisted client-side) after a reload.
    await page.reload();
    await expect(heroDe).toBeVisible(streamed);
  });
});
