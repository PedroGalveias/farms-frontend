import { expect, test } from "@playwright/test";

// The motion system, cross-engine: the custom cursor and decorative
// animations must run on fine-pointer desktops (Chromium ≈ Chrome/Brave/Edge
// on Windows & Linux, Gecko ≈ Firefox, WebKit ≈ Safari), fall silent under
// OS reduced motion, and come back — live, no reload — through the in-app
// "enable animations" rescue path.
test.describe("motion & custom cursor (motion allowed)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("custom cursor activates and tracks the pointer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/has-custom-cursor/);

    // Native cursor hidden inside the content zone; overlay dot present.
    const zoneCursor = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector(".cursor-zone h1, .cursor-zone p")!,
        ).cursor,
    );
    expect(zoneCursor).toBe("none");

    await page.mouse.move(400, 300);
    await page.waitForTimeout(120);
    const dotTransform = await page.evaluate(() => {
      const dot = document.querySelector<HTMLElement>(
        '[aria-hidden="true"].z-\\[9999\\] > div:last-child',
      );
      return dot?.style.transform ?? "";
    });
    expect(dotTransform).toContain("400px");
  });

  test("decorative animations run: reveal, marquee", async ({ page }) => {
    await page.goto("/");
    // NB: no locator.scrollIntoViewIfNeeded() on perpetually-animating
    // elements — Playwright waits for a stable bounding box, and a marquee
    // never settles (times out on Firefox/WebKit). Native scrolling instead.
    const anim = await page.evaluate(() => {
      const el = document.querySelector(".marquee-track")!;
      el.scrollIntoView({ block: "center" });
      const s = getComputedStyle(el);
      return { name: s.animationName, state: s.animationPlayState };
    });
    expect(anim.name).toContain("marquee");
    expect(anim.state).toBe("running");

    // Scroll reveal: below-fold content fades in on approach. Sweep the whole
    // page in viewport steps so every IntersectionObserver fires, then assert
    // that reveals actually ran — using .last() is brittle (a footer reveal
    // pinned to the page bottom may never cross the -10% root margin on the
    // taller Linux layout); "at least one revealed" is the real invariant.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const end = document.documentElement.scrollHeight;
      for (let y = 0; y <= end; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    await expect
      .poll(() => page.locator(".reveal.is-visible").count(), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
  });
});

test.describe("motion & custom cursor (OS reduced motion)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("everything rests, and the one-time prompt re-enables it live", async ({
    page,
  }) => {
    // page.emulateMedia (not test.use({ reducedMotion })): the describe-scoped
    // context option is applied unreliably across reused workers/engines,
    // while the page-level API works at runtime in all three engines.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Respectful defaults: no cursor, no marquee. `animation: none !important`
    // computes as either "none" or "" (empty) depending on the engine/CI
    // runner — both mean "not animating"; assert the marquee keyframe is NOT
    // applied rather than an exact idle token.
    await expect(page.locator("html")).not.toHaveClass(/has-custom-cursor/);
    const marqueeAnim = await page
      .locator(".marquee-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(marqueeAnim).not.toContain("marquee");

    // The discovery prompt appears (Windows "Animation effects" is off on
    // many machines without the user knowing) …
    const enable = page.getByRole("button", { name: /enable animations/i });
    await expect(enable).toBeVisible({ timeout: 10_000 });
    await enable.click();

    // … and enabling brings the site alive WITHOUT a reload.
    await expect(page.locator("html")).toHaveClass(/force-motion/);
    await expect(page.locator("html")).toHaveClass(/has-custom-cursor/);
    const marqueeAfter = await page
      .locator(".marquee-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(marqueeAfter).toContain("marquee");

    // The choice persists across reloads (applied pre-hydration) and the
    // prompt never returns.
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/force-motion/);
    await page.waitForTimeout(3000);
    await expect(
      page.getByRole("button", { name: /enable animations/i }),
    ).toHaveCount(0);
  });
});
