import { expect, test } from "@playwright/test";

// Firefox regression: the no-backdrop-filter fallback set `.glass { position:
// relative }` at a specificity that beat the `.fixed` utility, so fixed glass
// popups (motion prompt, install/update banner, back-to-top) turned relative
// and scrolled away with the page. They must compute `position: fixed` on every
// engine — including Firefox builds without backdrop-filter, where the bug lived.
test.use({ viewport: { width: 1280, height: 900 } });

test("fixed glass chrome computes position:fixed (not relative)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Reveal Back-to-top (always-present fixed .glass-chrome once scrolled).
  await page.mouse.wheel(0, 800);
  const backToTop = page.locator("button.glass-chrome").last();
  await expect(backToTop).toBeVisible({ timeout: 10_000 });

  expect(await backToTop.evaluate((el) => getComputedStyle(el).position)).toBe(
    "fixed",
  );
});
