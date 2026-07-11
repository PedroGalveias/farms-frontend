import { expect, test } from "@playwright/test";

// Every route must load without a thrown page error (hydration failures were
// shipping silently for weeks — React #418 throws in production builds) and
// without horizontal overflow at phone width. One spec, the whole surface.
const ROUTES = [
  "/",
  "/quick-search",
  "/saved",
  "/seasonal",
  "/canton",
  "/canton/be",
  "/product",
  "/product/dairy",
  "/region/region_mittelland",
  "/farm/11111111-1111-4111-8111-111111111111",
  "/profile",
  "/offline",
  "/haptics-lab",
];

test.describe("route health at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const route of ROUTES) {
    test(`${route} loads clean`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      await page.goto(route);
      // Let hydration + first paint settle.
      await page.waitForLoadState("networkidle");

      expect(pageErrors).toEqual([]);

      // No sideways scrolling anywhere.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);

      // Content boxes stay inside the viewport (the card-cull grid bug cut
      // cards off on the right; this guards every page against that class).
      const offenders = await page.evaluate(() => {
        const bad: string[] = [];
        const width = document.documentElement.clientWidth;
        for (const el of document.querySelectorAll<HTMLElement>(
          "header, main, article, main section, main h1, main h2",
        )) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0) continue;
          if (rect.left < -1 || rect.right > width + 1) {
            bad.push(
              `${el.tagName}.${String(el.className).slice(0, 50)} [${Math.round(rect.left)}..${Math.round(rect.right)}] vs 0..${width}`,
            );
          }
          if (bad.length >= 3) break;
        }
        return bad;
      });
      expect(offenders).toEqual([]);
    });
  }
});
