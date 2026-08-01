"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LanguageProvider";
import {
  rankMostWanted,
  readSearchCounts,
  trackSearch,
} from "@/lib/search-stats";
import {
  getTopFarmCategories,
  getUniqueFarmCantons,
  getUniqueFarmCategories,
  groupCantonsByRegion,
} from "@/lib/farms";
import {
  farmDistanceKm,
  getCantonCounts,
  getCategoryCounts,
  matchesCanton,
  matchesCategories,
  matchesSearch,
  withinRadius,
  type CategoryMatchMode,
} from "@/lib/directory";
import {
  clearStoredLocation,
  geolocationErrorKey,
  readStoredLocation,
  requestCurrentPosition,
  writeStoredLocation,
  type GeolocationCoords,
} from "@/lib/geolocation";
import {
  DEFAULT_DIRECTORY_PARAMS,
  parseDirectoryParams,
  type DirectoryParams,
} from "@/lib/directory-params";
import type { DirectoryViewMode, Farm, FarmSortOption } from "@/types/farm";

// How many farm cards to render per page — keeps the DOM light when the
// directory holds thousands of farms.
export const PAGE_SIZE = 24;

/**
 * Owns all of the home directory's interactive state: search/canton/category
 * filters, sort, radius, geolocation, view mode, and paging — plus the URL
 * round-trip, the disjunctive facet counts, and the ranked result list. The
 * shell component consumes this and stays presentational.
 */
export function useFarmDirectory(
  initialFarms: Farm[],
  // Parsed from the request's query string by the server component, so the
  // first render already shows the filtered view. Defaults keep every other
  // caller (and the tests) working unchanged.
  initialParams: DirectoryParams = DEFAULT_DIRECTORY_PARAMS,
) {
  const router = useRouter();
  const t = useT();

  const [searchTerm, setSearchTerm] = useState(initialParams.searchTerm);
  const [selectedCanton, setSelectedCanton] = useState(
    initialParams.selectedCanton,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialParams.selectedCategories,
  );
  const [categoryMatchMode, setCategoryMatchMode] = useState<CategoryMatchMode>(
    initialParams.categoryMatchMode,
  );
  const [sortOption, setSortOption] = useState<FarmSortOption>(
    initialParams.sortOption,
  );
  const [radiusKm, setRadiusKm] = useState<number | null>(
    initialParams.radiusKm,
  );
  const [originCoords, setOriginCoords] = useState<GeolocationCoords | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DirectoryViewMode>(
    initialParams.viewMode,
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);
  // Gates URL writes until the client has taken over.
  //
  // This is state, not a ref, on purpose. The filters now arrive already
  // correct from the server, so nothing in the sync effect's dependency list
  // changes after mount — with a ref, that effect would bail out once and never
  // run again, leaving an inert "?radius=25" (a radius with no origin) sitting
  // in the URL to be shared onward. Flipping a state value re-runs it exactly
  // once, after mount, which is when the pruning needs to happen.
  const [hydrated, setHydrated] = useState(false);

  // Keep filters in sync with Back/Forward via popstate.
  //
  // The mount-time read is gone: the server component now parses the same query
  // string through parseDirectoryParams and seeds the state above, so the first
  // render is already correct. Re-applying it here would only re-render the list
  // with values it already has — and while this effect owned the *initial* read,
  // the server had no idea a filter was requested, so a shared /?canton=BE link
  // painted "3155 farms" for ~400ms before the browser corrected it to 727.
  //
  // The stored location still loads here on purpose: it lives in localStorage,
  // which the server cannot see, and it must never travel in the URL.
  useEffect(() => {
    const applyFromUrl = () => {
      const next = parseDirectoryParams(
        new URLSearchParams(window.location.search),
      );
      setSearchTerm(next.searchTerm);
      setSelectedCanton(next.selectedCanton);
      setSelectedCategories(next.selectedCategories);
      setCategoryMatchMode(next.categoryMatchMode);
      setSortOption(next.sortOption);
      setRadiusKm(next.radiusKm);
      setViewMode(next.viewMode);
    };

    // Defer setState out of the effect body (repo lint: no sync setState here).
    queueMicrotask(() => {
      const stored = readStoredLocation();
      if (stored) {
        setOriginCoords(stored);
      }
      setHydrated(true);
    });

    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, []);

  // Mirror active filters into the URL and ask the server for its matching
  // candidate set. Local all-of and location refinements still run below.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const params = new URLSearchParams();
    // Keep text filtering instant locally, but let React defer the route change
    // so a fast typist does not start a server request for every keystroke.
    if (deferredSearchTerm.trim()) {
      params.set("q", deferredSearchTerm.trim());
    }
    if (selectedCanton !== "all") {
      params.set("canton", selectedCanton);
    }
    if (selectedCategories.length > 0) {
      params.set("cat", selectedCategories.join(","));
    }
    if (selectedCategories.length > 1 && categoryMatchMode === "all") {
      params.set("match", "all");
    }
    const sortForUrl =
      sortOption === "nearest" && !originCoords ? "newest" : sortOption;
    if (sortForUrl !== "newest") {
      params.set("sort", sortForUrl);
    }
    // Only share a radius that actually does something — see passesRadius.
    // Emitting it without an origin propagates the broken link onward.
    if (radiusKm !== null && originCoords) {
      params.set("radius", String(radiusKm));
    }
    if (viewMode !== "grid") {
      params.set("view", viewMode);
    }
    const query = params.toString();
    const href = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (
      `${window.location.pathname}${window.location.search}${window.location.hash}` !==
      href
    ) {
      router.replace(href, { scroll: false });
    }
  }, [
    hydrated,
    deferredSearchTerm,
    selectedCanton,
    selectedCategories,
    categoryMatchMode,
    sortOption,
    originCoords,
    radiusKm,
    viewMode,
    router,
  ]);

  const cantonOptions = useMemo(
    () => getUniqueFarmCantons(initialFarms),
    [initialFarms],
  );
  const categoryOptions = useMemo(
    () => getUniqueFarmCategories(initialFarms),
    [initialFarms],
  );
  const quickCategories = useMemo(
    () => getTopFarmCategories(initialFarms, 3),
    [initialFarms],
  );

  // "Most wanted" = this device's most-searched products/categories, blended
  // (today: just local) and padded with the most-available categories so it's
  // never empty. Starts from the availability fallback for SSR, then hydrates
  // to the search-ranked list on the client.
  const [mostWanted, setMostWanted] = useState<string[]>(quickCategories);
  useEffect(() => {
    queueMicrotask(() => {
      setMostWanted(
        rankMostWanted({
          localCounts: readSearchCounts(),
          fallback: quickCategories,
          limit: 3,
        }),
      );
    });
  }, [quickCategories, selectedCategories]);

  const cantonRegions = useMemo(
    () => groupCantonsByRegion(cantonOptions),
    [cantonOptions],
  );

  // Stable display order for the category chips: by overall popularity, computed
  // once from the full dataset so chips keep their place as the (contextual)
  // counts below change.
  const orderedCategoryOptions = useMemo(() => {
    const overall = getCategoryCounts(initialFarms);
    return [...categoryOptions].sort(
      (left, right) =>
        (overall[right] ?? 0) - (overall[left] ?? 0) ||
        left.localeCompare(right),
    );
  }, [initialFarms, categoryOptions]);

  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

  // "Nearest" only makes sense with a location; fall back gracefully so the
  // sort control always reflects a real, selectable option.
  const effectiveSort: FarmSortOption =
    sortOption === "nearest" && !originCoords ? "newest" : sortOption;

  // A radius from a shared URL is retained so it starts applying if the
  // visitor later shares a location, but it is not an active filter until
  // there is an origin to measure from. Keeping that distinction avoids a
  // misleading filter badge/chip for a radius that currently changes nothing.
  const activeRadiusKm = originCoords ? radiusKm : null;

  // Distance from the visitor to every farm, computed once per location change
  // and shared by the result list, the radius filter, and the facet counts.
  const distanceByFarmId = useMemo(() => {
    const distances = new Map<string, number | null>();
    if (originCoords) {
      for (const farm of initialFarms) {
        distances.set(farm.id, farmDistanceKm(farm, originCoords));
      }
    }
    return distances;
  }, [initialFarms, originCoords]);

  // A radius is only meaningful once we know where the visitor is: without an
  // origin every distance is null, and `withinRadius(null, 25)` rejects EVERY
  // farm. That turned a shared "?radius=25" link into an empty directory for
  // anyone who hadn't shared their location — with no visible way back, since
  // the radius control only renders while location is active. Treat the radius
  // as inert until there's an origin; it starts applying the moment one lands.
  // "newest" is the DEFAULT sort, so its comparator runs on every filter change.
  // Parsing `created_at` inside the comparator meant ~2·n·log n Date objects per
  // sort — measured at 8.35ms for 3155 farms on a fast laptop (so tens of ms of
  // jank on a mid-range phone, on every keystroke). Parse once per farm instead:
  // 1.91ms, a 4.4x win. Unparseable dates collapse to 0 rather than NaN, which
  // would make the comparator inconsistent and scramble the order.
  const createdAtByFarmId = useMemo(() => {
    const timestamps = new Map<string, number>();
    for (const farm of initialFarms) {
      const parsed = Date.parse(farm.created_at);
      timestamps.set(farm.id, Number.isFinite(parsed) ? parsed : 0);
    }
    return timestamps;
  }, [initialFarms]);

  const passesRadius = useCallback(
    (farm: Farm) =>
      withinRadius(
        originCoords ? (distanceByFarmId.get(farm.id) ?? null) : null,
        activeRadiusKm,
      ),
    [activeRadiusKm, distanceByFarmId, originCoords],
  );

  // Facet counts are *contextual*: each facet reflects the other active filters
  // but not itself (disjunctive faceting), so a count tells you what you'd get
  // by toggling that value given everything else you've already chosen.
  const categoryCounts = useMemo(
    () =>
      getCategoryCounts(
        initialFarms.filter(
          (farm) =>
            matchesSearch(farm, normalizedSearchTerm) &&
            matchesCanton(farm, selectedCanton) &&
            passesRadius(farm),
        ),
      ),
    [initialFarms, normalizedSearchTerm, selectedCanton, passesRadius],
  );

  const cantonCounts = useMemo(
    () =>
      getCantonCounts(
        initialFarms.filter(
          (farm) =>
            matchesSearch(farm, normalizedSearchTerm) &&
            matchesCategories(farm, selectedCategories, categoryMatchMode) &&
            passesRadius(farm),
        ),
      ),
    [
      initialFarms,
      normalizedSearchTerm,
      selectedCategories,
      categoryMatchMode,
      passesRadius,
    ],
  );

  // The result list: every active filter applied, distances attached, sorted.
  const ranked = useMemo(() => {
    const matched = initialFarms.filter(
      (farm) =>
        matchesSearch(farm, normalizedSearchTerm) &&
        matchesCanton(farm, selectedCanton) &&
        matchesCategories(farm, selectedCategories, categoryMatchMode) &&
        passesRadius(farm),
    );

    const withDistance = matched.map((farm) => ({
      farm,
      distanceKm: originCoords ? (distanceByFarmId.get(farm.id) ?? null) : null,
    }));

    return withDistance.sort((left, right) => {
      if (effectiveSort === "nearest") {
        const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY;
        const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY;
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return left.farm.name.localeCompare(right.farm.name);
      }

      if (effectiveSort === "name") {
        return left.farm.name.localeCompare(right.farm.name);
      }

      if (effectiveSort === "canton") {
        const byCanton = left.farm.canton.localeCompare(right.farm.canton);
        if (byCanton !== 0) {
          return byCanton;
        }
        return left.farm.name.localeCompare(right.farm.name);
      }

      return (
        (createdAtByFarmId.get(right.farm.id) ?? 0) -
        (createdAtByFarmId.get(left.farm.id) ?? 0)
      );
    });
  }, [
    initialFarms,
    normalizedSearchTerm,
    selectedCanton,
    selectedCategories,
    categoryMatchMode,
    originCoords,
    distanceByFarmId,
    createdAtByFarmId,
    passesRadius,
    effectiveSort,
  ]);

  const visibleFarms = useMemo(
    () => ranked.map((entry) => entry.farm),
    [ranked],
  );

  // Reset paging to the first page whenever the filters change — adjusting
  // state during render (React's documented pattern) avoids an effect.
  const filterKey = `${normalizedSearchTerm}|${selectedCanton}|${selectedCategories.join(
    ",",
  )}|${categoryMatchMode}|${effectiveSort}|${activeRadiusKm ?? "any"}|${
    originCoords ? "geo" : "none"
  }`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const activeFiltersCount = [
    searchTerm.trim().length > 0,
    selectedCanton !== "all",
    selectedCategories.length > 0,
    activeRadiusKm !== null,
  ].filter(Boolean).length;

  const refreshDirectory = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCanton("all");
    setSelectedCategories([]);
    setRadiusKm(null);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    // Selecting a category is a "search" signal for the Most-wanted card.
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((value) => value !== category);
      }
      trackSearch([category]);
      return [...current, category];
    });
  }, []);

  // Distance sorting: request the browser location only on tap (privacy), then
  // remember it so a return visit gets distance-sorted results without asking
  // again. Called directly (no await first) so iOS Safari shows the prompt.
  const locateMe = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);
    requestCurrentPosition().then((outcome) => {
      if (outcome.coords) {
        setOriginCoords(outcome.coords);
        writeStoredLocation(outcome.coords);
        setSortOption("nearest");
      } else {
        setLocationError(t(geolocationErrorKey(outcome.error)));
      }
      setIsLocating(false);
    });
  }, [t]);

  const clearLocation = useCallback(() => {
    setOriginCoords(null);
    setRadiusKm(null);
    setLocationError(null);
    clearStoredLocation();
    setSortOption((current) => (current === "nearest" ? "newest" : current));
  }, []);

  const loadMore = useCallback(
    () => setVisibleCount((count) => count + PAGE_SIZE),
    [],
  );

  return {
    // raw state
    searchTerm,
    selectedCanton,
    selectedCategories,
    categoryMatchMode,
    radiusKm,
    activeRadiusKm,
    viewMode,
    visibleCount,
    isLocating,
    locationError,
    isRefreshing,
    originCoords,
    effectiveSort,
    // derived data
    cantonOptions,
    cantonRegions,
    orderedCategoryOptions,
    categoryCounts,
    cantonCounts,
    mostWanted,
    distanceByFarmId,
    visibleFarms,
    activeFiltersCount,
    // setters / handlers
    setSearchTerm,
    setSelectedCanton,
    setSelectedCategories,
    setCategoryMatchMode,
    setSortOption,
    setRadiusKm,
    setViewMode,
    refreshDirectory,
    resetFilters,
    toggleCategory,
    locateMe,
    clearLocation,
    loadMore,
  };
}
