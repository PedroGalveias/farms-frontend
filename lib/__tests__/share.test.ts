import { describe, expect, it } from "vitest";
import { farmMetaDescription, farmPath, farmShareUrl } from "@/lib/share";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "abc 123",
    name: "Bauernhof Meier",
    address: "Dorfstrasse 1",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Gemüse", "Früchte"],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: null,
    ...overrides,
  };
}

describe("farmPath", () => {
  it("builds an encoded /farm path", () => {
    expect(farmPath("abc 123")).toBe("/farm/abc%20123");
  });
});

describe("farmShareUrl", () => {
  it("joins origin and path, tolerating a trailing slash", () => {
    expect(farmShareUrl("https://farms.example", "f1")).toBe(
      "https://farms.example/farm/f1",
    );
    expect(farmShareUrl("https://farms.example/", "f1")).toBe(
      "https://farms.example/farm/f1",
    );
  });
});

describe("farmMetaDescription", () => {
  it("names the farm, place, and a few localized categories", () => {
    const description = farmMetaDescription(makeFarm(), "en");
    expect(description).toContain("Bauernhof Meier");
    expect(description).toContain("Bern (BE)");
    expect(description).toContain("Vegetables");
    expect(description).toContain("Fruits");
  });

  it("omits the dash when a farm has no categories", () => {
    const description = farmMetaDescription(makeFarm({ categories: [] }), "en");
    expect(description).toBe("Bauernhof Meier in Bern (BE)");
  });
});
