import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const association = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "public/.well-known/apple-app-site-association"),
    "utf8",
  ),
) as {
  applinks: { details: Array<{ appID: string; paths: string[] }> };
  activitycontinuation: { apps: string[] };
};

const applicationID = "ZWW9ZJ3F9X.ch.farms.pedro.Farms";

describe("Apple app-site association", () => {
  it("authorizes the exact signed app for links and Handoff", () => {
    expect(association.applinks.details).toHaveLength(1);
    expect(association.applinks.details[0]?.appID).toBe(applicationID);
    expect(association.activitycontinuation.apps).toContain(applicationID);
  });

  it.each([
    "/en",
    "/farm/uuid",
    "/de/farm/uuid",
    "/canton/be",
    "/fr/product/apples",
    "/quick-search",
    "/it/saved",
    "/settings",
    "/rm/seasonal",
  ])("includes a universal-link rule for %s", (path) => {
    const patterns = association.applinks.details[0]?.paths ?? [];
    const matches = patterns.some((pattern) => {
      const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replaceAll("*", ".*")
        .replaceAll("?", ".");
      return new RegExp(`^${escaped}$`).test(path);
    });
    expect(matches).toBe(true);
  });

  it("does not claim web-only or infrastructure routes", () => {
    const paths = association.applinks.details[0]?.paths ?? [];
    expect(paths).not.toContain("*");
    expect(paths).not.toContain("/*");
    expect(paths).not.toContain("/api/*");
    expect(paths).not.toContain("/_next/*");
    expect(paths).not.toContain("/login");
    expect(paths).not.toContain("/*/farm/*");
    expect(paths).not.toContain("/*/settings");
    expect(paths).not.toContain("/profile");
    expect(paths).not.toContain("/*/profile");
    expect(paths).not.toContain("/verify-email");
    expect(paths).not.toContain("/*/verify-email");
  });

  it.each(["/api/farm/uuid", "/_next/farm/uuid", "/xx/farm/uuid"])(
    "does not match the unsupported path %s through a broad locale wildcard",
    (path) => {
      const patterns = association.applinks.details[0]?.paths ?? [];
      const matches = patterns.some((pattern) => {
        const escaped = pattern
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replaceAll("*", ".*")
          .replaceAll("?", ".");
        return new RegExp(`^${escaped}$`).test(path);
      });
      expect(matches).toBe(false);
    },
  );
});
