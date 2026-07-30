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

// CWE-1236: spreadsheets evaluate a cell beginning with =, +, -, @, tab or CR
// as a FORMULA, and RFC 4180 quoting does not stop it (quotes are stripped
// before interpretation). Farm names and addresses are user-submitted, so this
// reaches anyone who exports their saved farms and opens the file.
describe("farmsToCsv — formula injection", () => {
  const withName = (name: string): Farm[] => [
    {
      id: "1",
      name,
      address: "Dorf 1",
      canton: "BE",
      coordinates: "46.9,7.4",
      categories: ["Gemüse"],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: null,
    },
  ];

  it.each([
    ['=cmd|" /C calc"!A0', "="],
    ["+1+1", "+"],
    ["@SUM(A1)", "@"],
    ["-2+3+cmd|' /C calc'!A0", "-"],
  ])("prefixes a leading %s so it imports as text", (name) => {
    const row = farmsToCsv(withName(name)).split("\r\n")[1];
    // The cell content starts with the apostrophe, not the dangerous character.
    expect(row.replace(/^"/, "").startsWith("'")).toBe(true);
  });

  it("leaves genuine negative numbers numeric", () => {
    const row = farmsToCsv(withName("-5")).split("\r\n")[1];
    expect(row.startsWith("-5")).toBe(true);
  });

  it("still escapes quotes and commas per RFC 4180", () => {
    const row = farmsToCsv(withName('Hof "Berg", Süd')).split("\r\n")[1];
    expect(row.startsWith('"Hof ""Berg"", Süd"')).toBe(true);
  });
});
