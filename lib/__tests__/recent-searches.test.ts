import { afterEach, describe, expect, it } from "vitest";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
} from "@/lib/recent-searches";

afterEach(() => localStorage.clear());

describe("recent searches", () => {
  it("adds terms most-recent-first", () => {
    addRecentSearch("apples");
    addRecentSearch("bern");
    expect(readRecentSearches()).toEqual(["bern", "apples"]);
  });

  it("de-duplicates case-insensitively, moving the term to front", () => {
    addRecentSearch("Apples");
    addRecentSearch("bern");
    addRecentSearch("apples");
    expect(readRecentSearches()).toEqual(["apples", "bern"]);
  });

  it("ignores blank or too-short terms", () => {
    addRecentSearch("  ");
    addRecentSearch("a");
    expect(readRecentSearches()).toEqual([]);
  });

  it("caps the history at six", () => {
    for (const term of ["a1", "b2", "c3", "d4", "e5", "f6", "g7"]) {
      addRecentSearch(term);
    }
    const list = readRecentSearches();
    expect(list).toHaveLength(6);
    expect(list[0]).toBe("g7");
    expect(list).not.toContain("a1");
  });

  it("clears the history", () => {
    addRecentSearch("apples");
    expect(clearRecentSearches()).toEqual([]);
    expect(readRecentSearches()).toEqual([]);
  });
});
