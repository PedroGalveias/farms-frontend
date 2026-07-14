"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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
  RADIUS_OPTIONS,
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
export function useFarmDirectory(initialFarms: Farm[]) {
  const router = useRouter();
  const t = useT();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryMatchMode, setCategoryMatchMode] =
    useState<CategoryMatchMode>("any");
  const [sortOption, setSortOption] = useState<FarmSortOption>("newest");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [originCoords, setOriginCoords] = useState<GeolocationCoords | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);
  // Gates URL writes until after we've hydrated state from the URL on mount.
  const hydratedRef = useRef(false);

  // Hydrate filters from the URL on mount (so a shared/bookmarked link restores
  // the view) and keep them in sync with Back/Forward via popstate. The last
  // shared location is restored from localStorage — never from the URL, which
  // must not carry personal data.
  useEffect(() => {
    const applyFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const sortParam = params.get("sort");
      const sort: FarmSortOption =
        sortParam === "name" ||
        sortParam === "canton" ||
        sortParam === "nearest"
          ? sortParam
          : "newest";
      const radiusParam = Number(params.get("radius"));
      const radius = (RADIUS_OPTIONS as readonly number[]).includes(radiusParam)
        ? radiusParam
        : null;

      setSearchTerm(params.get("q") ?? "");
      setSelectedCanton(params.get("canton") ?? "all");
      setSelectedCategories(
        (params.get("cat") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      setCategoryMatchMode(params.get("match") === "all" ? "all" : "any");
      setSortOption(sort);
      setRadiusKm(radius);
      const viewParam = params.get("view");
      setViewMode(
        viewParam === "map" || viewParam === "list" ? viewParam : "grid",
      );
    };

    // Defer setState out of the effect body (repo lint: no sync setState here).
    queueMicrotask(() => {
      applyFromUrl();
      const stored = readStoredLocation();
      if (stored) {
        setOriginCoords(stored);
      }
      hydratedRef.current = true;
    });

    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, []);

  // Mirror the active filters into the URL (shareable, Back-button friendly).
  // replaceState keeps it client-side — no navigation or server refetch.
  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set("q", searchTerm.trim());
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
    if (radiusKm !== null) {
      params.set("radius", String(radiusKm));
    }
    if (viewMode !== "grid") {
      params.set("view", viewMode);
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [
    searchTerm,
    selectedCanton,
    selectedCategories,
    categoryMatchMode,
    sortOption,
    originCoords,
    radiusKm,
    viewMode,
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

  const passesRadius = useCallback(
    (farm: Farm) =>
      withinRadius(
        originCoords ? (distanceByFarmId.get(farm.id) ?? null) : null,
        radiusKm,
      ),
    [distanceByFarmId, originCoords, radiusKm],
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
        new Date(right.farm.created_at).getTime() -
        new Date(left.farm.created_at).getTime()
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
  )}|${categoryMatchMode}|${effectiveSort}|${radiusKm ?? "any"}|${
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
    radiusKm !== null,
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
