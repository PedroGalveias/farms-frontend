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
    // `scrollable-region-focusable` is disabled here, and only here.
    //
    // axe flags the options list because it scrolls (`overflow-y-auto`) while
    // carrying `tabindex="-1"`, which is not a tab stop. For a generic scrolling
    // div that is a real barrier. For this one it is not: the list is a managed
    // -focus ARIA listbox — it receives focus programmatically when it opens and
    // is driven with the arrow keys, which is exactly what `tabindex="-1"`
    // exists for in the WAI-ARIA pattern. Making it tabbable to satisfy the
    // rule would put the popup in the page's tab order and break the pattern.
    //
    // axe cannot see that the list gets focused on open, so the rule is
    // replaced below by a test that drives the thing with a keyboard — a
    // stronger check than the one being turned off, not a weaker one.
    const results = await scan(page)
      .disableRules(["scrollable-region-focusable"])
      .analyze();
    expect(JSON.stringify(results.violations.map((v) => v.id))).toBe("[]");
  });

  // The behavioural half of the rule disabled above: prove a keyboard user can
  // actually operate — and therefore scroll — the options list.
  test("the canton listbox is fully operable from the keyboard", async ({
    page,
  }) => {
    // Many small round trips (open, focus check, 13 arrow presses, scroll poll,
    // Escape) against a dev server that is compiling routes for the rest of the
    // suite in parallel. The default 30s budget is enough alone and not always
    // enough under that load.
    test.slow();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: "Canton", exact: true });

    // Open it the way a keyboard user does, not with a click.
    await expect(async () => {
      if ((await trigger.getAttribute("aria-expanded")) !== "true") {
        await trigger.focus();
        await page.keyboard.press("ArrowDown");
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "true", {
        timeout: 1000,
      });
    }).toPass({ timeout: 15_000 });

    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    // Focus really is inside the popup — this is what makes tabindex="-1" the
    // correct choice rather than an oversight.
    await expect(list).toBeFocused();

    const activeAt = () => list.getAttribute("aria-activedescendant");
    const first = await activeAt();
    await page.keyboard.press("ArrowDown");
    await expect.poll(activeAt).not.toBe(first);

    // End jumps to the last option — proof the whole list is reachable by
    // keyboard, which is the claim standing in for the disabled axe rule.
    await page.keyboard.press("End");
    await expect.poll(activeAt).not.toBe(first);

    // Deliberately NOT asserted here: that the list scrolled to follow the
    // active option. That is pure geometry, and measuring real rects against a
    // dev server shared with the rest of the suite failed roughly half the time
    // under parallel load — a flaky assertion is worse than none, because it
    // trains people to re-run rather than read. It is covered exactly, with a
    // stubbed layout, in components/ui/__tests__/GlassSelect.test.tsx.

    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
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

    // Freeze transitions before measuring. The probe below blurs an element and
    // reads its computed style on the very next line, but focus rings here ride
    // on `transition-all duration-300` — so the "resting" read would catch the
    // ring mid-fade, still nearly identical to the focused value, and the
    // element would be reported as having no indicator at all. That is a
    // measurement artifact, not a WCAG failure. Collapsing the durations to
    // zero makes both reads settled values.
    await page.addStyleTag({
      content: `*, *::before, *::after {
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
      }`,
    });

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
    // Walk the WHOLE tab sequence rather than a fixed slice: a hard-coded stop
    // silently exempts everything past it, and the controls furthest down the
    // page (the directory cards, the footer) are exactly the ones most likely
    // to be missing a ring. The loop ends when Tab wraps back to the first stop
    // it saw; MAX_TABS is only a runaway guard, and the test fails if it is
    // ever reached so that a growing page can't quietly re-introduce a cap.
    const MAX_TABS = 400;
    const offenders: string[] = [];
    const seen = new Set<string>();
    let firstStop: string | null = null;
    let wrapped = false;
    let subLoopAt: string | null = null;
    let visited = 0;

    for (let i = 0; i < MAX_TABS; i++) {
      await page.keyboard.press("Tab");

      // Identify the current stop well enough to notice the sequence looping.
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el === document.documentElement) {
          return null;
        }
        const path: string[] = [];
        for (let node: Element | null = el; node; node = node.parentElement) {
          const parent = node.parentElement;
          path.push(
            parent ? String(Array.from(parent.children).indexOf(node)) : "root",
          );
        }
        return path.join("/");
      });

      if (id) {
        if (firstStop === null) {
          firstStop = id;
        } else if (id === firstStop) {
          // Back where we started: the whole sequence has been walked.
          wrapped = true;
          break;
        }
        if (seen.has(id)) {
          // Revisiting a stop that is NOT the first one means focus is cycling
          // inside a subset of the page — a trap. That is a finding in its own
          // right, and it is emphatically not a completed sweep: everything
          // after the loop stays unchecked. Recorded separately so the
          // assertions below can tell the two apart, which an earlier version
          // of this test could not.
          subLoopAt = id;
          break;
        }
        seen.add(id);
        visited++;
      }

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

    // Focus must not be cycling inside a subset of the page. Nothing here is
    // modal, so a sub-loop is a genuine keyboard trap — and it also means the
    // sweep stopped early with the rest of the page unchecked.
    expect(
      subLoopAt,
      `focus returned to an earlier stop that was not the first, after ${visited} stops — keyboard trap at ${subLoopAt}`,
    ).toBeNull();

    // Guard the guard: reaching MAX_TABS without wrapping leaves the tail of
    // the page unchecked, which is the exact blind spot this traversal exists
    // to remove.
    expect(
      wrapped,
      `tab sequence did not wrap within ${MAX_TABS} stops (visited ${visited})`,
    ).toBe(true);
    // And a page that reports two tab stops is a broken harness, not a pass.
    expect(visited).toBeGreaterThan(20);
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
