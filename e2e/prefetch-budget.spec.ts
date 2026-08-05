import { expect, test, type Request } from "@playwright/test";

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
  const seen: Request[] = [];
  page.on("requestfinished", (request) => {
    if (request.url().includes("_rsc=")) {
      seen.push(request);
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

  const farmPrefetches = seen.filter((r) => r.url().includes("/farm/")).length;

  // The cards are the thing under test: none of them should prefetch.
  expect(farmPrefetches).toBe(0);

  // And the page as a whole stays well under what it used to do. 94 was the
  // measured "before"; anything approaching it means a list regained the
  // default.
  expect(seen.length).toBeLessThan(60);

  // Bytes as well as requests, because the two can move in OPPOSITE
  // directions and the request count alone would call that a win.
  // `prefetchInlining` was measured on this exact page and cut requests 34 ->
  // 20 while pushing the wire cost 55 -> 82 KB, by serving each prefetch a
  // full static shell instead of a partial payload (see next.config.ts for why
  // it stays off). A budget on request count would have waved that through.
  let wire = 0;
  for (const request of seen) {
    const sizes = await request.sizes().catch(() => null);
    wire += (sizes?.responseBodySize ?? 0) + (sizes?.responseHeadersSize ?? 0);
  }
  // Measured at ~55 KB. Loose, like the count above: this catches a change in
  // kind, not drift with the fixture.
  expect(wire).toBeLessThan(140 * 1024);
});
