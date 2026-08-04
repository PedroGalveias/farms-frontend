import { expect, test } from "@playwright/test";

/**
 * Direct coverage for the quick-search dot-map (issue #183).
 *
 * A screenshot cannot do this job. The panel's snapshot passed for months on an
 * effectively blank canvas — 63 bright pixels in the map band against 8,638 in
 * the headline band — so the map contributed almost nothing and a broken
 * projection looked identical to a working one. #180 changed the projection
 * substantially (a stretched vertical smear became a correctly letterboxed
 * country) and the screenshot moved by 322 pixels, all of it the ambient
 * backdrop. Then #188 masked the canvas outright to stop it destabilising the
 * snapshot, which made the gap permanent.
 *
 * So this reads the canvas back instead: how many dots were drawn, and what
 * shape they form. Both are things the picture was never actually asserting.
 */

/** Switzerland is about 1.6 times wider than it is tall. */
const CH_ASPECT = 1.6;

test.describe("quick-search dot map", () => {
  test.beforeEach(async ({ page }) => {
    // The panel paints one static frame under reduced motion, which is what
    // makes reading it back deterministic.
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("draws the farm field, and draws it Switzerland-shaped", async ({
    page,
  }) => {
    await page.goto("/quick-search");
    await page.waitForLoadState("networkidle");

    const canvas = page.getByTestId("discovery-dot-map");
    await expect(canvas).toBeVisible();

    // Wait for the field to actually be on the canvas — the effect draws after
    // mount, and asserting immediately would race it.
    const stats = await page.waitForFunction(
      () => {
        const el = document.querySelector<HTMLCanvasElement>(
          '[data-testid="discovery-dot-map"]',
        );
        const ctx = el?.getContext("2d");
        if (!el || !ctx || el.width === 0 || el.height === 0) {
          return null;
        }

        const { data, width, height } = ctx.getImageData(
          0,
          0,
          el.width,
          el.height,
        );
        let lit = 0;
        let minX = width;
        let maxX = -1;
        let minY = height;
        let maxY = -1;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            // The base field is drawn at low alpha; anything meaningfully
            // opaque is a dot rather than the transparent backdrop.
            if (data[(y * width + x) * 4 + 3] > 24) {
              lit += 1;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        return lit > 200
          ? { lit, w: maxX - minX + 1, h: maxY - minY + 1 }
          : null;
      },
      undefined,
      { timeout: 15_000 },
    );

    // `waitForFunction` only resolves once the predicate returns something
    // truthy, so this is never null at runtime — but its type still carries the
    // null the polling function returns while it waits.
    const { lit, w, h } = (await stats.jsonValue())!;

    // ~3,000 farms are drawn as ~1.4px dots. A few hundred lit pixels is the
    // floor below which the canvas is blank, which is exactly the state the
    // screenshot was happily passing on.
    expect(lit).toBeGreaterThan(200);

    // The shape is the part #180 fixed and the picture missed. Scaling x and y
    // independently to the panel stretches the country to whatever the box
    // happens to be; on a narrow column that is an unrecognisable smear. A
    // generous band, because the dot field's own extent is not the exact
    // bounding box of the projection.
    const aspect = w / h;
    expect(aspect).toBeGreaterThan(CH_ASPECT * 0.6);
    expect(aspect).toBeLessThan(CH_ASPECT * 1.6);
  });

  test("keeps the country letterboxed on a narrow panel", async ({ page }) => {
    // The iPad-landscape case from #180: the map column is roughly 0.5:1
    // against the country's 1.6:1, so a naive fit smears it vertically.
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/quick-search");
    await page.waitForLoadState("networkidle");

    const canvas = page.getByTestId("discovery-dot-map");
    const box = await canvas.boundingBox();
    test.skip(!box || box.width === 0, "panel is desktop-only");

    const shape = await page.waitForFunction(
      () => {
        const el = document.querySelector<HTMLCanvasElement>(
          '[data-testid="discovery-dot-map"]',
        );
        const ctx = el?.getContext("2d");
        if (!el || !ctx || el.width === 0) return null;
        const { data, width, height } = ctx.getImageData(
          0,
          0,
          el.width,
          el.height,
        );
        let minX = width;
        let maxX = -1;
        let minY = height;
        let maxY = -1;
        let lit = 0;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (data[(y * width + x) * 4 + 3] > 24) {
              lit += 1;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        return lit > 200 ? { w: maxX - minX + 1, h: maxY - minY + 1 } : null;
      },
      undefined,
      { timeout: 15_000 },
    );

    const { w, h } = (await shape.jsonValue())!;
    // Wider than tall, always. A vertical smear is the regression.
    expect(w).toBeGreaterThan(h);
  });
});
