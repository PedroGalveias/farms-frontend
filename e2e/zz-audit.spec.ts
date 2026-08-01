import { test } from "@playwright/test";

const ROUTES = [
  "/",
  "/quick-search",
  "/saved",
  "/settings",
  "/profile",
  "/seasonal",
  "/canton",
  "/canton/be",
  "/product",
  "/product/dairy",
  "/region/region_mittelland",
  "/farm/11111111-1111-4111-8111-111111111111",
  "/offline",
  "/de",
  "/fr/product/dairy",
];

for (const vp of [
  { n: "desktop", w: 1440, h: 900 },
  { n: "mobile", w: 390, h: 844 },
]) {
  test(`audit ${vp.n}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    const findings: string[] = [];

    for (const route of ROUTES) {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 120));
      });
      page.on("pageerror", (e) =>
        errors.push("PAGEERROR " + e.message.slice(0, 120)),
      );
      await page
        .goto(route, { waitUntil: "networkidle" })
        .catch((e) => errors.push("NAV " + e.message.slice(0, 80)));
      await page.waitForTimeout(400);

      const r = await page.evaluate(() => {
        const de = document.documentElement;
        const overflowX = de.scrollWidth - de.clientWidth;
        // Elements sticking out past the right edge
        const wide = Array.from(document.querySelectorAll("*"))
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && b.right > de.clientWidth + 2;
          })
          .slice(0, 3)
          .map(
            (el) =>
              el.tagName +
              "." +
              String((el as HTMLElement).className).slice(0, 40),
          );
        const imgsNoAlt = Array.from(document.querySelectorAll("img")).filter(
          (i) => !i.hasAttribute("alt"),
        ).length;
        const ids = Array.from(document.querySelectorAll("[id]")).map(
          (e) => e.id,
        );
        const dupIds = ids.filter((id, i) => id && ids.indexOf(id) !== i);
        const emptyLinks = Array.from(document.querySelectorAll("a")).filter(
          (a) =>
            !(a.textContent || "").trim() &&
            !a.getAttribute("aria-label") &&
            !a.getAttribute("title"),
        ).length;
        const h1s = document.querySelectorAll("h1").length;
        return {
          overflowX,
          wide,
          imgsNoAlt,
          dupIds: [...new Set(dupIds)].slice(0, 3),
          emptyLinks,
          h1s,
        };
      });

      const bad: string[] = [];
      if (r.overflowX > 2)
        bad.push(`h-overflow ${r.overflowX}px ${JSON.stringify(r.wide)}`);
      if (r.imgsNoAlt) bad.push(`img-no-alt ${r.imgsNoAlt}`);
      if (r.dupIds.length) bad.push(`dup-id ${JSON.stringify(r.dupIds)}`);
      if (r.emptyLinks) bad.push(`unnamed-link ${r.emptyLinks}`);
      if (r.h1s !== 1) bad.push(`h1-count ${r.h1s}`);
      if (errors.length)
        bad.push(`console ${JSON.stringify([...new Set(errors)].slice(0, 2))}`);
      if (bad.length) findings.push(`${route} :: ${bad.join(" | ")}`);
      page.removeAllListeners("console");
      page.removeAllListeners("pageerror");
    }
    console.log(
      "AUDIT[" +
        vp.n +
        "]\n" +
        (findings.length ? findings.join("\n") : "  clean"),
    );
  });
}
