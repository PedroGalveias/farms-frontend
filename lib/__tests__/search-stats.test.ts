import { afterEach, describe, expect, it } from "vitest";
import {
  SEARCH_STATS_STORAGE_KEY,
  incrementCounts,
  mergeCounts,
  rankMostWanted,
  readSearchCounts,
  topKeys,
  trackSearch,
  writeSearchCounts,
} from "@/lib/search-stats";

afterEach(() => window.localStorage.clear());

describe("incrementCounts", () => {
  it("adds one per key without mutating the input", () => {
    const input = { a: 1 };
    const out = incrementCounts(input, ["a", "b", "b"]);
    expect(out).toEqual({ a: 2, b: 2 });
    expect(input).toEqual({ a: 1 });
  });
});

describe("mergeCounts", () => {
  it("sums multiple maps", () => {
    expect(mergeCounts({ a: 1, b: 2 }, { a: 3 })).toEqual({ a: 4, b: 2 });
  });
});

describe("prototype-pollution safety", () => {
  it("ignores dangerous keys when incrementing", () => {
    const out = incrementCounts({}, ["__proto__", "constructor", "ok"]);
    expect(out).toEqual({ ok: 1 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("ignores dangerous keys when reading and merging", () => {
    window.localStorage.setItem(
      SEARCH_STATS_STORAGE_KEY,
      JSON.stringify({ __proto__: 5, ok: 2 }),
    );
    expect(readSearchCounts()).toEqual({ ok: 2 });
    expect(mergeCounts({ ok: 1 }, { prototype: 9 })).toEqual({ ok: 1 });
  });
});

describe("topKeys", () => {
  it("orders by count desc, then alphabetically, capped at limit", () => {
    expect(topKeys({ a: 1, b: 3, c: 3 }, 2)).toEqual(["b", "c"]);
  });
});

describe("rankMostWanted", () => {
  it("ranks by blended local + global counts", () => {
    const ranked = rankMostWanted({
      localCounts: { Erdbeeren: 5 },
      globalCounts: { Tomaten: 9 },
      fallback: ["Gemüse"],
      limit: 2,
    });
    expect(ranked).toEqual(["Tomaten", "Erdbeeren"]);
  });

  it("pads with the fallback when stats are thin, never duplicating", () => {
    expect(
      rankMostWanted({
        localCounts: { Erdbeeren: 2 },
        fallback: ["Erdbeeren", "Gemüse", "Früchte"],
        limit: 3,
      }),
    ).toEqual(["Erdbeeren", "Gemüse", "Früchte"]);
  });

  it("is pure fallback when there are no stats", () => {
    expect(
      rankMostWanted({ localCounts: {}, fallback: ["A", "B"], limit: 2 }),
    ).toEqual(["A", "B"]);
  });
});

describe("persistence", () => {
  it("tracks and reads back counts", () => {
    trackSearch(["Erdbeeren", "Erdbeeren", "Tomaten"]);
    expect(readSearchCounts()).toEqual({ Erdbeeren: 2, Tomaten: 1 });
  });

  it("ignores empty tracks and corrupt storage", () => {
    trackSearch([]);
    expect(readSearchCounts()).toEqual({});
    window.localStorage.setItem(SEARCH_STATS_STORAGE_KEY, "{bad");
    expect(readSearchCounts()).toEqual({});
  });

  it("drops non-positive / non-numeric entries on read", () => {
    writeSearchCounts({ a: 2 });
    window.localStorage.setItem(
      SEARCH_STATS_STORAGE_KEY,
      JSON.stringify({ a: 2, b: 0, c: "x" }),
    );
    expect(readSearchCounts()).toEqual({ a: 2 });
  });
});
