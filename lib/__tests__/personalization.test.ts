import { afterEach, describe, expect, it } from "vitest";
import {
  FAVORITES_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  readFavorites,
  readRecent,
  recordRecent,
  toggleId,
  writeFavorites,
  writeRecent,
} from "@/lib/personalization";

afterEach(() => window.localStorage.clear());

describe("toggleId", () => {
  it("adds an absent id and removes a present one", () => {
    expect(toggleId([], "a")).toEqual(["a"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("does not mutate the input", () => {
    const input = ["a"];
    toggleId(input, "b");
    expect(input).toEqual(["a"]);
  });
});

describe("recordRecent", () => {
  it("moves an id to the front and de-duplicates", () => {
    expect(recordRecent(["a", "b"], "b")).toEqual(["b", "a"]);
    expect(recordRecent(["a", "b"], "c")).toEqual(["c", "a", "b"]);
  });

  it("caps the history length", () => {
    expect(recordRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });
});

describe("favorites persistence", () => {
  it("round-trips through localStorage", () => {
    writeFavorites(["a", "b"]);
    expect(readFavorites()).toEqual(["a", "b"]);
    expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toContain("a");
  });

  it("returns an empty array when nothing or junk is stored", () => {
    expect(readFavorites()).toEqual([]);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, "{not json");
    expect(readFavorites()).toEqual([]);
  });

  it("ignores non-string entries", () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(["a", 2]),
    );
    expect(readFavorites()).toEqual(["a"]);
  });
});

describe("recent persistence", () => {
  it("round-trips through localStorage", () => {
    writeRecent(["x"]);
    expect(readRecent()).toEqual(["x"]);
    expect(window.localStorage.getItem(RECENT_STORAGE_KEY)).toContain("x");
  });
});
