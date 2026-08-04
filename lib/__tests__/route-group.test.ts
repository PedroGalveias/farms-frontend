import { describe, expect, it } from "vitest";
import { ROUTE_GROUPS, isRouteGroup, routeGroupFor } from "@/lib/route-group";

describe("routeGroupFor", () => {
  it.each([
    ["/", "/"],
    ["/canton", "/canton"],
    ["/saved", "/saved"],
    ["/settings", "/settings"],
  ])("keeps the static route %s", (path, expected) => {
    expect(routeGroupFor(path)).toBe(expected);
  });

  it.each([
    ["/canton/be", "/canton/[code]"],
    ["/canton/zh", "/canton/[code]"],
    ["/farm/8f14e45f-ceea-467a-9575-7f0c1d5f0b2e", "/farm/[id]"],
    ["/product/apples", "/product/[slug]"],
    ["/region/espace-mittelland", "/region/[key]"],
  ])("folds %s to its template", (path, expected) => {
    // 26 cantons are one page with one performance profile. Kept apart they are
    // 26 series each holding a twenty-sixth of the traffic, and no p75.
    expect(routeGroupFor(path)).toBe(expected);
  });

  it("collapses all 26 cantons into a single group", () => {
    const cantons = [
      "ag",
      "ai",
      "ar",
      "be",
      "bl",
      "bs",
      "fr",
      "ge",
      "gl",
      "gr",
      "ju",
      "lu",
      "ne",
      "nw",
      "ow",
      "sg",
      "sh",
      "so",
      "sz",
      "tg",
      "ti",
      "ur",
      "vd",
      "vs",
      "zg",
      "zh",
    ];
    const groups = new Set(cantons.map((c) => routeGroupFor(`/canton/${c}`)));
    expect(groups).toEqual(new Set(["/canton/[code]"]));
  });

  it("does not mistake a bare code for a canton page", () => {
    // `/be` is not a route this app serves; only `/canton/be` is.
    expect(routeGroupFor("/be")).toBe("other");
  });

  it.each([
    ["/de/canton/be", "/canton/[code]"],
    ["/fr/saved", "/saved"],
    ["/it/", "/"],
    ["/rm", "/"],
  ])("strips the locale prefix from %s", (path, expected) => {
    // English is unprefixed, so keeping the prefix would make one route look
    // like five.
    expect(routeGroupFor(path)).toBe(expected);
  });

  it("ignores query strings and hashes", () => {
    expect(routeGroupFor("/canton/be?sort=name#list")).toBe("/canton/[code]");
    // A query string is free text; it must never reach a metric label.
    expect(routeGroupFor("/?q=anything%20at%20all")).toBe("/");
  });

  it.each([
    ["/nope"],
    ["/canton/be/extra/deep"],
    ["/../../etc/passwd"],
    ["not-a-path"],
    [""],
  ])("sends the unrecognised %s to one bucket", (path) => {
    // The pathname is attacker-controllable. Anything off the closed list has
    // to collapse, or a hand-written URL mints a new time series.
    expect(routeGroupFor(path)).toBe("other");
  });

  it("only ever returns a known group", () => {
    const paths = ["/", "/canton/be", "/x/y/z", "/de/settings", "??"];
    for (const path of paths) {
      expect(isRouteGroup(routeGroupFor(path))).toBe(true);
      expect(ROUTE_GROUPS).toContain(routeGroupFor(path));
    }
  });
});
