import { expect, test } from "@playwright/test";

/**
 * A budget on speculative prefetching.
 *
 * Next prefetches every `<Link>` as it scrolls into view. On a card grid that
 * is bad economics: a canton page renders up to 48 farm cards and the visitor
 * opens one, so the rest is work paid by everybody. Measured before
 * `prefetch={false}` landed on `FarmLinkCard`: **94 RSC requests and 119,929
 * bytes** for a single page view. After: 38 requests, 13,269 bytes.
 *
 * The budget below is deliberately loose — it is here to catch a card grid
 * quietly regaining prefetch, not to pin an exact number that shifts with
 * fixture size. If this fails, something in a list started prefetching again.
 *
 * Prefetching is PRODUCTION-ONLY, so this measures nothing under `next dev` —
 * which is precisely how the original regression went unnoticed through two
 * audits.
 */
test("a canton page does not prefetch its whole card grid", async ({
  page,
}) => {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("_rsc=")) {
      seen.push(request.url());
    }
  });

  await page.goto("/canton/be");
  await page.waitForLoadState("networkidle");

  // Scroll the full page so every link would enter the viewport.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  });
  await page.waitForTimeout(2000);

  const farmPrefetches = seen.filter((url) => url.includes("/farm/")).length;

  // The cards are the thing under test: none of them should prefetch.
  expect(farmPrefetches).toBe(0);

  // And the page as a whole stays well under what it used to do. 94 was the
  // measured "before"; anything approaching it means a list regained the
  // default.
  expect(seen.length).toBeLessThan(60);
});
