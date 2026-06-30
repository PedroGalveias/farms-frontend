import { describe, expect, it } from "vitest";
import { fuzzyScore, rankCommands, type CommandItem } from "@/lib/command";

describe("fuzzyScore", () => {
  it("matches an empty query against anything with a neutral score", () => {
    expect(fuzzyScore("", "Berghof")).toBe(0);
  });

  it("returns null when characters are missing or out of order", () => {
    expect(fuzzyScore("xyz", "Berghof")).toBeNull();
    expect(fuzzyScore("fb", "Berghof")).toBeNull(); // f then b — wrong order
  });

  it("ranks a prefix above a mid-word substring above a subsequence", () => {
    const prefix = fuzzyScore("berg", "Berghof")!;
    const midword = fuzzyScore("hof", "Berghof")!;
    const subseq = fuzzyScore("bgf", "Berghof")!;
    expect(prefix).toBeGreaterThan(midword);
    expect(midword).toBeGreaterThan(subseq);
    expect(subseq).not.toBeNull();
  });

  it("rewards a word-boundary hit over a mid-word one", () => {
    const boundary = fuzzyScore("farm", "Green Farm")!;
    const midword = fuzzyScore("arm", "Green Farm")!;
    expect(boundary).toBeGreaterThan(midword);
  });
});

describe("rankCommands", () => {
  const items: CommandItem[] = [
    { id: "1", kind: "farm", label: "Berghof", hint: "BE · Bern" },
    { id: "2", kind: "farm", label: "Talhof", hint: "BE · Bern" },
    { id: "3", kind: "product", label: "Strawberries", hint: "Fruit" },
    { id: "4", kind: "page", label: "Saved" },
  ];

  it("returns the original order (capped) for an empty query", () => {
    expect(rankCommands("", items, 2).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("filters out non-matches", () => {
    const ids = rankCommands("hof", items).map((i) => i.id);
    expect(ids).toContain("1");
    expect(ids).toContain("2");
    expect(ids).not.toContain("3");
  });

  it("weights label matches above hint matches", () => {
    // "bern" is only in the hints; "Berghof" matches it as a label prefix too.
    const ranked = rankCommands("ber", items);
    expect(ranked[0].id).toBe("1"); // Berghof — label hit wins
  });

  it("honours the result limit", () => {
    expect(rankCommands("", items, 1)).toHaveLength(1);
  });
});
