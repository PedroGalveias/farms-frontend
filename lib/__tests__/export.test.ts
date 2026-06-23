import { describe, expect, it } from "vitest";
import { farmsToCsv } from "@/lib/export";
import type { Farm } from "@/types/farm";

function makeFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: "f1",
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

describe("farmsToCsv", () => {
  it("emits a header row and one row per farm", () => {
    const csv = farmsToCsv([makeFarm()]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe(
      "Name,Canton,Canton code,Address,Coordinates,Categories,Added",
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Bauernhof Meier");
    expect(lines[1]).toContain("Bern");
    // Categories share one field, joined with "; ".
    expect(lines[1]).toContain("Gemüse; Früchte");
  });

  it("starts with a UTF-8 BOM for spreadsheet apps", () => {
    expect(farmsToCsv([])).toMatch(/^﻿/);
  });

  it("quotes and escapes fields containing commas or quotes", () => {
    const csv = farmsToCsv([
      makeFarm({ name: 'Hof "Sonne", Bio', address: "Weg 1, 3000 Bern" }),
    ]);
    expect(csv).toContain('"Hof ""Sonne"", Bio"');
    expect(csv).toContain('"Weg 1, 3000 Bern"');
  });
});
