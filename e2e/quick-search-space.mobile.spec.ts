import { expect, test } from "@playwright/test";

// The quick-search deck must give the ACTIVE step real room on phones: the
// container height was silently invalid CSS (calc without spaces) so the deck
// never sized, and advancing a step left the hero hogging the viewport. These
// pin the fixed behavior: a tall deck, scroll-to-deck on step change, and a
// usable picker/results area.
test("quick-search deck fills the phone viewport per step", async ({
  page,
}) => {
  await page.goto("/quick-search");
  await page.waitForLoadState("networkidle");

  const deck = page.getByRole("group").filter({ has: page.locator("article") });
  const deckBox = await deck.boundingBox();
  // The deck is at least ~65% of the viewport tall (clamp lower bound 520px).
  expect(deckBox!.height).toBeGreaterThanOrEqual(500);

  // Advance to products.
  await page
    .getByRole("button", { name: /choose products/i })
    .first()
    .tap();

  // The page scrolls the deck to the top so the picker gets the viewport.
  await page.waitForFunction(() => window.scrollY > 100, undefined, {
    timeout: 5_000,
  });
  const topAfter = await deck.evaluate((el) => el.getBoundingClientRect().top);
  expect(topAfter).toBeLessThan(140);

  // The products picker has a real scroll area (not a letterbox): at least
  // ~35% of the viewport regardless of device height.
  const contentHeight = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("article")];
    const current = cards[1]; // products card
    const area = current?.querySelector(".overflow-y-auto");
    return area ? area.getBoundingClientRect().height : 0;
  });
  const viewportHeight = page.viewportSize()!.height;
  expect(contentHeight).toBeGreaterThan(viewportHeight * 0.35);
});
