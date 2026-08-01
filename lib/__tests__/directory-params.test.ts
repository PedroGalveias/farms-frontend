import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIRECTORY_PARAMS,
  parseDirectoryParams,
  toFarmsQuery,
} from "@/lib/directory-params";

describe("parseDirectoryParams", () => {
  it("returns the unfiltered defaults for an empty query", () => {
    expect(parseDirectoryParams(new URLSearchParams())).toEqual(
      DEFAULT_DIRECTORY_PARAMS,
    );
    expect(parseDirectoryParams({})).toEqual(DEFAULT_DIRECTORY_PARAMS);
  });

  it("reads every supported filter", () => {
    const params = parseDirectoryParams(
      new URLSearchParams(
        "q=berghof&canton=BE&cat=Gem%C3%BCse,Fr%C3%BCchte&match=all&sort=name&radius=25&view=map",
      ),
    );
    expect(params).toEqual({
      searchTerm: "berghof",
      selectedCanton: "BE",
      selectedCategories: ["Gemüse", "Früchte"],
      categoryMatchMode: "all",
      sortOption: "name",
      radiusKm: 25,
      viewMode: "map",
    });
  });

  // The whole point of this module is that the server component and the client
  // hook derive identical state. If the two shapes disagreed, the server would
  // render one view and React would hydrate another.
  it("reads a plain record exactly like URLSearchParams", () => {
    const query = "q=hof&canton=ZH&cat=Dairy&sort=canton&radius=50&view=list";
    const fromSearchParams = parseDirectoryParams(new URLSearchParams(query));
    const fromRecord = parseDirectoryParams({
      q: "hof",
      canton: "ZH",
      cat: "Dairy",
      sort: "canton",
      radius: "50",
      view: "list",
    });
    expect(fromRecord).toEqual(fromSearchParams);
  });

  it("takes the first value when Next hands over a repeated param", () => {
    expect(parseDirectoryParams({ canton: ["BE", "ZH"] }).selectedCanton).toBe(
      "BE",
    );
  });

  // A hand-edited or stale link should degrade to the full directory, never to
  // an empty one or a crash.
  describe("unknown values fall back instead of filtering to nothing", () => {
    it("ignores an unknown sort", () => {
      expect(parseDirectoryParams({ sort: "bogus" }).sortOption).toBe("newest");
    });

    it("ignores a radius that is not one of the offered options", () => {
      expect(parseDirectoryParams({ radius: "999" }).radiusKm).toBeNull();
      expect(parseDirectoryParams({ radius: "abc" }).radiusKm).toBeNull();
      expect(parseDirectoryParams({ radius: "" }).radiusKm).toBeNull();
    });

    it("ignores an unknown view mode", () => {
      expect(parseDirectoryParams({ view: "nonsense" }).viewMode).toBe("grid");
    });

    it("treats any match value other than 'all' as 'any'", () => {
      expect(parseDirectoryParams({ match: "all" }).categoryMatchMode).toBe(
        "all",
      );
      expect(parseDirectoryParams({ match: "either" }).categoryMatchMode).toBe(
        "any",
      );
    });
  });

  it("drops blank entries and padding from the category list", () => {
    expect(
      parseDirectoryParams({ cat: " Dairy , , Fruits ,," }).selectedCategories,
    ).toEqual(["Dairy", "Fruits"]);
    expect(parseDirectoryParams({ cat: "" }).selectedCategories).toEqual([]);
    expect(parseDirectoryParams({ cat: " , " }).selectedCategories).toEqual([]);
  });

  it("maps representable filters to stable API slugs", () => {
    expect(
      toFarmsQuery({
        ...DEFAULT_DIRECTORY_PARAMS,
        searchTerm: "  berry farm  ",
        selectedCanton: "BE",
        selectedCategories: ["Früchte", "Gemüse"],
        sortOption: "name",
      }),
    ).toEqual({
      q: "berry farm",
      canton: "BE",
      categories: ["fruits", "vegetables"],
      sort: "name",
    });
  });

  it("keeps multi-category all matching local until the API exposes it", () => {
    expect(
      toFarmsQuery({
        ...DEFAULT_DIRECTORY_PARAMS,
        selectedCategories: ["Früchte", "Gemüse"],
        categoryMatchMode: "all",
      }),
    ).toEqual({});
  });

  it("keeps an unknown canton verbatim so the UI can show an empty result", () => {
    // Unlike sort/view, a canton the data doesn't contain is a legitimate (if
    // empty) filter rather than a malformed value — silently widening it to
    // "all" would show results the URL didn't ask for.
    expect(parseDirectoryParams({ canton: "XX" }).selectedCanton).toBe("XX");
  });
});
