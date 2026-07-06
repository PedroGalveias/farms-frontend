import { expect, test } from "@playwright/test";

// Regression net for the on-device iOS failures: the directory crashing under
// load, and the page ending up shifted sideways / not centered. Runs on a
// phone-sized viewport with touch enabled, loads several "Load more" pages
// (the mock backend serves 240 farms) and long-scrolls the list, asserting
// the page stays alive, never overflows horizontally, and stays centered.
test.describe("directory at phone scale", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("survives load-more + long scroll without overflow or drift", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    let crashed = false;
    page.on("crash", () => {
      crashed = true;
    });

    await page.goto("/");
    await expect(page.locator("article").first()).toBeVisible();

    // Load several pages of cards (24 per click).
    const loadMore = page.getByRole("button", { name: /load more/i });
    for (let i = 0; i < 6; i++) {
      if ((await loadMore.count()) === 0) break;
      await loadMore.scrollIntoViewIfNeeded();
      await loadMore.click();
      await page.waitForTimeout(150);
    }
    const cards = await page.locator("article").count();
    expect(cards).toBeGreaterThan(100);

    // Long scroll through the whole list in viewport-sized steps — this is
    // the gesture that killed the tab on device.
    const steps = await page.evaluate(() =>
      Math.ceil(document.documentElement.scrollHeight / window.innerHeight),
    );
    for (let i = 0; i <= steps; i++) {
      await page.evaluate((step) => {
        window.scrollTo({ top: step * window.innerHeight, behavior: "auto" });
      }, i);
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    expect(crashed).toBe(false);
    expect(pageErrors).toEqual([]);

    // The document must never be horizontally scrollable…
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);

    // …and no CONTENT box (header, toolbar, any card) may poke past the
    // viewport edges — the on-device symptom was cards cut off on the right.
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      const width = document.documentElement.clientWidth;
      const targets = document.querySelectorAll<HTMLElement>(
        "header, main, article, main section, main h2",
      );
      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;
        if (rect.left < -1 || rect.right > width + 1) {
          bad.push(
            `${el.tagName}.${String(el.className).slice(0, 50)} [${Math.round(rect.left)}..${Math.round(rect.right)}] vs 0..${width}`,
          );
          if (bad.length >= 5) break;
        }
      }
      return bad;
    });
    expect(offenders).toEqual([]);

    // …and the list stays centered: equal gutters on both sides of <main>.
    const gutters = await page.evaluate(() => {
      const rect = document.querySelector("main")!.getBoundingClientRect();
      return {
        left: rect.left,
        right: document.documentElement.clientWidth - rect.right,
      };
    });
    expect(Math.abs(gutters.left - gutters.right)).toBeLessThanOrEqual(1);
  });

  test("form controls meet the 16px iOS no-zoom floor", async ({ page }) => {
    // Firefox's touch emulation doesn't flip the pointer media queries the
    // rule is gated on; Chromium and WebKit (the engine that matters for the
    // iOS zoom bug) do.
    test.skip(
      test.info().project.name === "firefox",
      "FF touch emulation does not set any-pointer: coarse",
    );

    await page.goto("/");
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        "input, select, textarea",
      )) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 16) {
          bad.push(`${el.tagName}#${el.id || el.className} ${size}px`);
        }
      }
      return bad;
    });
    expect(small).toEqual([]);
  });
});
