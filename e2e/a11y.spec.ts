import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Automated accessibility net. axe catches the mechanical WCAG failures —
// contrast, names, roles, landmark structure, duplicate ids — across every
// route and the interactive states that only exist after a click (sheets,
// modals, listboxes, the command palette), which a route-only scan never sees.
//
// axe finds roughly a third of real accessibility problems; it cannot judge
// focus ORDER or whether a label reads sensibly. Those are covered by the
// keyboard tests at the bottom of this file.
//
// Chromium-only: these are DOM/CSS assertions, not engine behaviour, so running
// them three times would triple the runtime for identical results.
test.describe("accessibility", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "DOM-level a11y assertions don't vary by engine",
  );
  test.use({ viewport: { width: 1280, height: 900 } });

  // WCAG 2.1 A + AA is the bar the design brief sets (§2 contrast gate).
  const scan = (page: Page) =>
    new AxeBuilder({ page }).withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
    ]);

  const ROUTES = [
    ["home", "/"],
    ["quick search", "/quick-search"],
    ["saved", "/saved"],
    ["settings", "/settings"],
    ["profile", "/profile"],
    ["seasonal", "/seasonal"],
    ["canton hub", "/canton"],
    ["canton page", "/canton/be"],
    ["product hub", "/product"],
    ["region page", "/region/region_mittelland"],
    ["farm detail", "/farm/11111111-1111-4111-8111-111111111111"],
    ["offline", "/offline"],
  ] as const;

  for (const [name, path] of ROUTES) {
    test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await scan(page).analyze();
      // Report the rule ids and the offending markup, so a failure is
      // actionable straight from the CI log.
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 120)),
      }));
      expect(JSON.stringify(summary, null, 2)).toBe("[]");
    });
  }

  test("the open detail sheet has no violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article").first()).toBeVisible();
    await page.evaluate(() =>
      document
        .querySelector("article")
        ?.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    const open = page
      .getByRole("article")
      .first()
      .getByRole("button", { name: /view details/i });
    await expect(async () => {
      await open.click({ force: true, timeout: 2000 });
      await expect(page.locator(".qs-dock")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 25_000 });

    const results = await scan(page).analyze();
    expect(JSON.stringify(results.violations.map((v) => v.id))).toBe("[]");
  });

  test("the login modal has no violations", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /log in/i })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    const results = await scan(page).analyze();
    expect(JSON.stringify(results.violations.map((v) => v.id))).toBe("[]");
  });

  test("the command palette has no violations", async ({ page }) => {
    await page.goto("/");
    // The ⌘K listener attaches on hydration — pressing earlier is a no-op.
    await page.waitForLoadState("networkidle");
    await expect(async () => {
      await page.keyboard.press("ControlOrMeta+k");
      await expect(page.locator("dialog[open]")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    const results = await scan(page).analyze();
    expect(JSON.stringify(results.violations.map((v) => v.id))).toBe("[]");
  });

  test("the canton listbox has no violations while open", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: "Canton", exact: true });
    // A click that lands before hydration is simply lost, so this retries —
    // but the trigger is a TOGGLE, so only click while it reports closed.
    // Clicking unconditionally just shuts it again on the next attempt.
    await expect(async () => {
      if ((await trigger.getAttribute("aria-expanded")) !== "true") {
        await trigger.click();
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "true", {
        timeout: 1000,
      });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByRole("listbox")).toBeVisible();
    const results = await scan(page).analyze();
    expect(JSON.stringify(results.violations.map((v) => v.id))).toBe("[]");
  });
});

// Things axe cannot check: that focus goes somewhere sensible, that it is
// visible, that it is trapped inside a modal, and that Escape gets you out.
test.describe("keyboard navigation", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "focus behaviour is asserted once",
  );
  test.use({ viewport: { width: 1280, height: 900 } });

  test("the first Tab reaches the skip link, which jumps to main", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");

    // Asserting the target merely EXISTS proves nothing — the point of a skip
    // link is that activating it moves focus past the chrome. Verify the next
    // Tab lands inside #main-content, which is the behaviour a keyboard user
    // actually depends on.
    await expect(page.locator("#main-content")).toHaveCount(1);
    await page.keyboard.press("Tab");
    const landedInMain = await page.evaluate(() => {
      const main = document.querySelector("#main-content");
      return (
        !!main &&
        !!document.activeElement &&
        main.contains(document.activeElement)
      );
    });
    expect(landedInMain).toBe(true);
  });

  test("every focused element shows a visible focus indicator", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Compare the computed style BEFORE and AFTER focus and require that
    // SOMETHING changed visually.
    //
    // The earlier version of this test enumerated properties that "count" as a
    // focus ring and included `borderColor !== ""` as a fallback — but
    // getComputedStyle always resolves borderColor to a real colour, so that
    // clause was permanently true and the test could never fail. A test that
    // cannot fail is worse than no test: it reports safety it never checked.
    //
    // Diffing before/after sidesteps the whole question of WHICH property
    // signals focus. Any of outline, box-shadow, border or background changing
    // is a visible indicator; none of them changing is a real WCAG 2.4.7
    // failure.
    const offenders: string[] = [];

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");

      const result = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el === document.documentElement) {
          return null;
        }

        const snapshot = (node: HTMLElement) => {
          const s = getComputedStyle(node);
          return [
            s.outlineStyle,
            s.outlineWidth,
            s.outlineColor,
            s.boxShadow,
            s.borderColor,
            s.borderWidth,
            s.backgroundColor,
          ].join("|");
        };

        const focused = snapshot(el);
        // Blur to read the resting style, then restore focus so the Tab
        // sequence continues from where it was.
        el.blur();
        const resting = snapshot(el);
        el.focus();

        if (focused !== resting) {
          return null;
        }
        return `${el.tagName.toLowerCase()}.${(el.className?.toString() ?? "").slice(0, 60)}`;
      });

      if (result) {
        offenders.push(result);
      }
    }

    expect(offenders).toEqual([]);
  });

  test("the login modal traps focus and Escape closes it", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /log in/i })
      .first()
      .click();
    const heading = page.getByRole("heading", { name: /welcome back/i });
    await expect(heading).toBeVisible();

    // Tab a full lap; focus must never escape the dialog.
    const dialog = page.getByRole("dialog").first();
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const inside = await dialog.evaluate(
        (node) =>
          !!document.activeElement && node.contains(document.activeElement),
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(heading).toBeHidden();
  });
});
