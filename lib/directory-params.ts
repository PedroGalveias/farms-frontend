import { categorySlug } from "@/lib/categories";
import { RADIUS_OPTIONS, type CategoryMatchMode } from "@/lib/directory";
import type { FarmsQuery } from "@/lib/farms-service";
import type { DirectoryViewMode, FarmSortOption } from "@/types/farm";

/** The slice of directory state that lives in the URL. */
export interface DirectoryParams {
  searchTerm: string;
  selectedCanton: string;
  selectedCategories: string[];
  categoryMatchMode: CategoryMatchMode;
  sortOption: FarmSortOption;
  radiusKm: number | null;
  viewMode: DirectoryViewMode;
}

/** What the directory shows when the URL carries no filters. */
export const DEFAULT_DIRECTORY_PARAMS: DirectoryParams = {
  searchTerm: "",
  selectedCanton: "all",
  selectedCategories: [],
  categoryMatchMode: "any",
  sortOption: "newest",
  radiusKm: null,
  viewMode: "grid",
};

/**
 * A single reader for the query string, shared by the server component and the
 * client hook.
 *
 * Both sides MUST derive the same state from the same URL. When only the client
 * knew how to read these params, the server rendered the unfiltered directory
 * and the browser corrected it after hydration — "3155 farms" visibly became
 * "727 farms" about 400ms later on a shared /?canton=BE link, every filtered URL
 * served identical HTML to crawlers, and the whole list was filtered twice.
 * Keeping the parsing in one place is what makes the two renders agree; two
 * copies of this logic would drift and reintroduce a hydration mismatch.
 *
 * Unknown values fall back to the default rather than being rejected, so a
 * hand-edited or stale link degrades to the full directory instead of an empty
 * one.
 */
export function parseDirectoryParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): DirectoryParams {
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) {
      return input.get(key) ?? undefined;
    }
    const value = input[key];
    // Next hands over repeated params as an array (?cat=a&cat=b); take the
    // first so the shape is always a string.
    return Array.isArray(value) ? value[0] : value;
  };

  const sortParam = get("sort");
  const sortOption: FarmSortOption =
    sortParam === "name" || sortParam === "canton" || sortParam === "nearest"
      ? sortParam
      : "newest";

  const radiusParam = Number(get("radius"));
  const radiusKm = (RADIUS_OPTIONS as readonly number[]).includes(radiusParam)
    ? radiusParam
    : null;

  const viewParam = get("view");
  const viewMode: DirectoryViewMode =
    viewParam === "map" || viewParam === "list" ? viewParam : "grid";

  return {
    searchTerm: get("q") ?? "",
    selectedCanton: get("canton") ?? "all",
    selectedCategories: (get("cat") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    categoryMatchMode: get("match") === "all" ? "all" : "any",
    sortOption,
    radiusKm,
    viewMode,
  };
}

/**
 * The server-queryable subset of directory state.
 *
 * Everything sent here is ALSO re-applied locally after hydration, so only
 * filters the client can reproduce exactly may be included — otherwise rows
 * appear and then vanish. What stays local, and why:
 *
 *  - **free text** — the API matches product names, and the directory payload
 *    has no products, so a server-matched farm would be filtered straight back
 *    out on the client.
 *  - **radius and nearest** — the visitor's coordinates are private and never
 *    in the URL.
 *  - **a multi-category ALL match** — the API's category filter is any-of.
 *    Sending an all-match would under-fetch: the server would return the union
 *    where the visitor asked for the intersection, and farms that should be
 *    filtered out locally would never arrive to be counted.
 *
 * Categories are sent only when EVERY selected one has an API slug. A partial
 * list is worse than none: the server would drop the categories it was not
 * told about, and the missing farms would look like an empty result rather
 * than a filter that could not be expressed.
 */
export function toFarmsQuery(params: DirectoryParams): FarmsQuery {
  const slugs = params.selectedCategories.map(categorySlug);
  const canSendCategories =
    params.selectedCategories.length > 0 &&
    slugs.every((slug): slug is string => Boolean(slug)) &&
    !(
      params.categoryMatchMode === "all" && params.selectedCategories.length > 1
    );

  return {
    ...(params.selectedCanton !== "all"
      ? { canton: params.selectedCanton }
      : {}),
    ...(canSendCategories ? { categories: slugs as string[] } : {}),
    ...(params.sortOption === "name" || params.sortOption === "canton"
      ? { sort: params.sortOption }
      : {}),
  };
}

/** Whether a query would actually narrow the directory. */
export function narrowsTheDirectory(query: FarmsQuery): boolean {
  return Boolean(
    query.canton || (query.categories && query.categories.length > 0),
  );
}
