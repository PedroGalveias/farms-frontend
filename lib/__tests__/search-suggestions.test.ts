import { describe, expect, it } from "vitest";
import { buildSuggestions } from "@/lib/search-suggestions";

const sources = {
  farms: [
    { id: "a", name: "Hof Sonnenmatt", address: "Dorfstrasse 1", canton: "BE" },
    { id: "b", name: "Berghof", address: "Alpweg 3", canton: "GR" },
    { id: "c", name: "Sonnenhof", address: "Sonnenweg 2", canton: "ZH" },
  ],
  categories: [
    { value: "Vegetables", label: "Vegetables" },
    { value: "Dairy", label: "Dairy" },
  ],
  cantons: [
    { code: "BE", name: "Bern" },
    { code: "ZH", name: "Zurich" },
  ],
};

describe("buildSuggestions", () => {
  it("returns nothing for an empty query", () => {
    expect(buildSuggestions("", sources)).toEqual([]);
    expect(buildSuggestions("   ", sources)).toEqual([]);
  });

  it("matches farms by name and tags them", () => {
    const out = buildSuggestions("sonnen", sources);
    const farms = out.filter((s) => s.type === "farm");
    expect(farms.map((f) => f.id)).toContain("a");
    expect(farms.map((f) => f.id)).toContain("c");
    expect(farms[0].sublabel).toBeDefined();
  });

  it("matches farms by address too", () => {
    const out = buildSuggestions("alpweg", sources);
    expect(out.some((s) => s.type === "farm" && s.id === "b")).toBe(true);
  });

  it("surfaces category and canton matches", () => {
    const veg = buildSuggestions("veget", sources);
    expect(
      veg.some((s) => s.type === "category" && s.id === "Vegetables"),
    ).toBe(true);
    const bern = buildSuggestions("bern", sources);
    expect(bern.some((s) => s.type === "canton" && s.id === "BE")).toBe(true);
  });

  it("orders farms before categories before cantons", () => {
    // "be" hits Berghof (farm), Bern (canton).
    const out = buildSuggestions("ber", sources);
    const firstFarm = out.findIndex((s) => s.type === "farm");
    const firstCanton = out.findIndex((s) => s.type === "canton");
    expect(firstFarm).toBeGreaterThanOrEqual(0);
    if (firstCanton >= 0) expect(firstFarm).toBeLessThan(firstCanton);
  });
});
