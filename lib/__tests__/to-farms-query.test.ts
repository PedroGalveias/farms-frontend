import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIRECTORY_PARAMS,
  narrowsTheDirectory,
  toFarmsQuery,
} from "@/lib/directory-params";
import type { DirectoryParams } from "@/lib/directory-params";

const params = (over: Partial<DirectoryParams> = {}): DirectoryParams => ({
  ...DEFAULT_DIRECTORY_PARAMS,
  ...over,
});

describe("toFarmsQuery", () => {
  it("sends nothing for the default view", () => {
    expect(toFarmsQuery(params())).toEqual({});
    expect(narrowsTheDirectory(toFarmsQuery(params()))).toBe(false);
  });

  it("sends the canton", () => {
    expect(toFarmsQuery(params({ selectedCanton: "BE" }))).toEqual({
      canton: "BE",
    });
  });

  it("sends categories as API slugs, never display labels", () => {
    // The API validates against its own vocabulary; a German label would be
    // rejected outright.
    expect(
      toFarmsQuery(
        params({ selectedCategories: ["Früchte", "Milchprodukte"] }),
      ),
    ).toEqual({ categories: ["fruits", "dairy"] });
  });

  it("withholds an ALL match across several categories", () => {
    // The API's category filter is any-of. Sending an all-match would return
    // the union where the visitor asked for the intersection — an under-fetch
    // the client could not correct, because the missing farms never arrive.
    expect(
      toFarmsQuery(
        params({
          selectedCategories: ["Früchte", "Milchprodukte"],
          categoryMatchMode: "all",
        }),
      ),
    ).toEqual({});
  });

  it("still sends a single category in ALL mode", () => {
    // One category is the same set either way.
    expect(
      toFarmsQuery(
        params({ selectedCategories: ["Früchte"], categoryMatchMode: "all" }),
      ),
    ).toEqual({ categories: ["fruits"] });
  });

  it("withholds the whole category filter if any one lacks a slug", () => {
    // A partial list is worse than none: the server would silently drop the
    // category it was not told about, and the result would look like an empty
    // filter rather than one that could not be expressed.
    expect(
      toFarmsQuery(
        params({ selectedCategories: ["Früchte", "Not A Real Category"] }),
      ),
    ).toEqual({});
  });

  it("never sends free text", () => {
    // The API matches `q` against product names, and the directory payload has
    // no products — a server-matched farm would be filtered back out on the
    // client and the list would shrink after hydration.
    const query = toFarmsQuery(params({ searchTerm: "strawberries" }));
    expect(query).toEqual({});
    expect(JSON.stringify(query)).not.toContain("strawberries");
  });

  it("never sends radius or coordinates", () => {
    // A visitor's location is private and is not in the shareable URL.
    expect(toFarmsQuery(params({ radiusKm: 25 }))).toEqual({});
  });

  it.each([
    ["name", { sort: "name" }],
    ["canton", { sort: "canton" }],
    ["newest", {}],
  ] as const)("maps the %s sort", (sortOption, expected) => {
    // `newest` is the backend default; omitting it keeps the default view on
    // one cache key rather than two identical ones.
    expect(toFarmsQuery(params({ sortOption }))).toEqual(expected);
  });
});

describe("narrowsTheDirectory", () => {
  it("is true only when the result set actually shrinks", () => {
    expect(narrowsTheDirectory({})).toBe(false);
    // Sorting reorders; it does not narrow, so the list is still every farm and
    // is safe to write to the offline cache.
    expect(narrowsTheDirectory({ sort: "name" })).toBe(false);
    expect(narrowsTheDirectory({ canton: "BE" })).toBe(true);
    expect(narrowsTheDirectory({ categories: ["fruits"] })).toBe(true);
    expect(narrowsTheDirectory({ categories: [] })).toBe(false);
  });
});
