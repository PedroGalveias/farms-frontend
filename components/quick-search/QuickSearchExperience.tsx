"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  MapPin,
  Pencil,
  RotateCcw,
  Search,
  ShoppingBasket,
  Sparkles,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import DiscoveryPanel from "@/components/quick-search/DiscoveryPanel";
import FarmDetailSheet from "@/components/quick-search/FarmDetailSheet";
import LocationStep, {
  type GeoState,
} from "@/components/quick-search/LocationStep";
import ProductsStep from "@/components/quick-search/ProductsStep";
import ResultsStep from "@/components/quick-search/ResultsStep";
import QuickSearchCoach from "@/components/quick-search/QuickSearchCoach";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { KNOWN_CATEGORY_KEYS } from "@/lib/categories";
import { PRODUCTS, tagLabel } from "@/lib/products";
import { readSearchCounts, topKeys, trackSearch } from "@/lib/search-stats";
import { haptic } from "@/lib/haptics";
import { playTick } from "@/lib/sound";
import { geolocationErrorKey, requestCurrentPosition } from "@/lib/geolocation";
import { getCantonName, getUniqueFarmCantons } from "@/lib/farms";
import { prefersReducedMotion } from "@/lib/motion";
import { runViewTransition } from "@/lib/view-transitions";
import {
  getQuickSearchProducts,
  getQuickSearchResults,
  parseQuickSearchCoordinates,
  readLastQuickSearch,
  writeLastQuickSearch,
  type QuickSearchCoordinates,
  type QuickSearchLocation,
  type QuickSearchMatchMode,
} from "@/lib/quick-search";
import type { Farm, ServiceStatus } from "@/types/farm";

type QuickSearchStep = "location" | "products" | "results";

// Each card in the deck peeks this many pixels when stacked behind the
// current one. The card height (100% - 112px) reserves room for two strips.
const PEEK_PX = 56;

interface StepMeta {
  icon: LucideIcon;
  id: QuickSearchStep;
  labelKey: string;
}

// Evergreen starter products — granular catalog keys (German, like the
// dataset) whose labels localize via productLabel.
const DEFAULT_STARTERS = [
  "Käse",
  "Honig",
  "Kartoffeln",
  "Äpfel",
  "Brot",
  "Milch",
];

const STEPS: StepMeta[] = [
  { icon: MapPin, id: "location", labelKey: "qs_step_location" },
  { icon: ShoppingBasket, id: "products", labelKey: "qs_step_products" },
  { icon: Sprout, id: "results", labelKey: "qs_step_results" },
];

const SERVICE_STATUS_PILLS: Record<
  ServiceStatus,
  { className: string; dotClassName: string; labelKey: string }
> = {
  degraded: {
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
    dotClassName: "bg-amber-500",
    labelKey: "status_degraded",
  },
  offline: {
    className: "bg-rose-500/10 text-rose-700 ring-rose-500/25",
    dotClassName: "bg-rose-500",
    labelKey: "status_offline",
  },
  online: {
    className: "bg-pine/10 text-pine ring-pine/20",
    dotClassName: "bg-pine-bright",
    labelKey: "qs_status_live",
  },
};

const PRIMARY_BUTTON_CLASS =
  "group inline-flex w-full items-center justify-center gap-2 rounded-chip bg-ink px-6 py-4 text-sm font-bold text-cloud shadow-elev-3 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none";

const GHOST_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-chip border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/75 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20";

interface QuickSearchExperienceProps {
  farms: Farm[];
  loadError: string | null;
  serviceStatus: ServiceStatus;
}

export default function QuickSearchExperience({
  farms,
  loadError,
  serviceStatus,
}: QuickSearchExperienceProps) {
  const { locale, t } = useLanguage();
  const { recordView } = usePersonalization();
  const [step, setStep] = useState<QuickSearchStep>("location");
  const [locationInput, setLocationInput] = useState("");
  const [sharedCoordinates, setSharedCoordinates] =
    useState<QuickSearchCoordinates | null>(null);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<QuickSearchMatchMode>("all");
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [resultsVisit, setResultsVisit] = useState(0);
  const [resumable, setResumable] = useState<{
    matchMode: QuickSearchMatchMode;
    products: string[];
  } | null>(null);

  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);
  // Gates URL writes until state has hydrated from the URL on mount.
  const urlHydratedRef = useRef(false);

  const products = useMemo(() => getQuickSearchProducts(farms), [farms]);

  // One-tap starters above the grid: this device's own most-searched keys,
  // topped up with evergreen picks so first-time visitors see them too.
  const [starterKeys, setStarterKeys] = useState<string[]>(DEFAULT_STARTERS);
  useEffect(() => {
    const personal = topKeys(readSearchCounts(), 6).filter(
      (key) => key in PRODUCTS || KNOWN_CATEGORY_KEYS.includes(key),
    );
    const merged = [...new Set([...personal, ...DEFAULT_STARTERS])].slice(0, 6);
    queueMicrotask(() => setStarterKeys(merged));
  }, []);

  const cantonOptions = useMemo(
    () =>
      getUniqueFarmCantons(farms).map((code) => ({
        code,
        name: getCantonName(code),
      })),
    [farms],
  );

  const typedCoordinates = useMemo(
    () => parseQuickSearchCoordinates(locationInput),
    [locationInput],
  );

  const location = useMemo<QuickSearchLocation>(
    () => ({
      coordinates: sharedCoordinates ?? typedCoordinates,
      label: sharedCoordinates ? "your current location" : locationInput.trim(),
    }),
    [locationInput, sharedCoordinates, typedCoordinates],
  );

  const results = useMemo(
    () =>
      getQuickSearchResults({ farms, location, matchMode, selectedProducts }),
    [farms, location, matchMode, selectedProducts],
  );

  // Live counts for BOTH match modes (§9 "smarter match toggle"): "Match all"
  // can silently zero out at 2,500-farm scale, so surface each mode's yield on
  // the toggle itself. Independent of the active mode (both computed once).
  const matchCounts = useMemo(() => {
    if (selectedProducts.length === 0) {
      return { all: 0, any: 0 };
    }
    const count = (mode: QuickSearchMatchMode) =>
      getQuickSearchResults({
        farms,
        location,
        matchMode: mode,
        selectedProducts,
      }).length;
    return { all: count("all"), any: count("any") };
  }, [farms, location, selectedProducts]);

  const currentIndex = STEPS.findIndex((meta) => meta.id === step);
  const statusPill = SERVICE_STATUS_PILLS[serviceStatus];

  // Deep link (e.g. the home "in season" card): ?products=Key1,Key2 pre-selects
  // those keys — each may be a category group OR a specific product
  // (subcategory). An optional ?match=any sets the match mode (seasonal links
  // use "any" so a broad in-season selection still returns farms).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("products");
    const keys = (raw ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(
        (value) => KNOWN_CATEGORY_KEYS.includes(value) || value in PRODUCTS,
      );
    const stored = readLastQuickSearch();

    // Defer out of the effect body (repo lint: no sync setState in effects).
    queueMicrotask(() => {
      if (keys.length > 0) {
        setSelectedProducts(keys);
        if (params.get("match") === "any") {
          setMatchMode("any");
        }
      } else if (params.get("resume") === "1" && stored) {
        // The "Repeat last search" PWA shortcut: jump straight to results.
        setSelectedProducts(stored.products);
        setMatchMode(stored.matchMode);
        setResultsVisit((visit) => visit + 1);
        setStep("results");
      } else if (stored) {
        // A previous search exists — offer it as a one-tap resume chip.
        setResumable(stored);
      }
      urlHydratedRef.current = true;
    });
  }, []);

  // Mirror the selection into the URL so a search is shareable and
  // Back-button friendly. Products + match mode only — location never
  // enters the URL. replaceState keeps it client-side.
  useEffect(() => {
    if (!urlHydratedRef.current) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("products");
    params.delete("match");
    params.delete("resume");
    if (selectedProducts.length > 0) {
      params.set("products", selectedProducts.join(","));
      if (matchMode === "any") {
        params.set("match", "any");
      }
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [matchMode, selectedProducts]);

  // Move focus to the card that just came to the foreground so keyboard
  // users are not stranded on a button that became inert.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    cardRefs.current[currentIndex]?.focus({ preventScroll: true });
  }, [currentIndex]);

  const goToStep = (nextStep: QuickSearchStep) => {
    if (nextStep === step) {
      return;
    }

    if (nextStep === "results") {
      setResultsVisit((visit) => visit + 1);
      // Viewing results is the strongest "search" signal — feed the home
      // Most-wanted card (per-device stats) and the resume chip.
      trackSearch(selectedProducts);
      writeLastQuickSearch({ matchMode, products: selectedProducts });
    }

    // The deck slide is the page's signature move — make it felt. goToStep
    // only ever runs inside a tap/click, so the iOS gesture window is open.
    haptic(12);
    playTick();

    setStep(nextStep);

    // All three step cards stay mounted, so a card's scroller keeps its old
    // scrollTop from the previous visit — re-entering Results used to show
    // the first card half-clipped under the step header (design §9 bug).
    // Reset the entering card's scroller so content starts fully visible.
    requestAnimationFrame(() => {
      const index = STEPS.findIndex((meta) => meta.id === nextStep);
      const scroller = cardRefs.current[index]?.querySelector<HTMLElement>(
        "[data-step-scroller]",
      );
      if (scroller) {
        scroller.scrollTop = 0;
      }
    });

    // Below lg the hero sits above the deck and would keep the active card
    // half off-screen — bring the deck to the top so each step gets the whole
    // viewport. Desktop centres the deck in a fixed column; leave it alone.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        deckRef.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  };

  const isStepEnabled = (index: number) =>
    index < 2 || selectedProducts.length > 0;

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);

    // Typing always wins over a previously shared browser location, so the
    // search never silently uses coordinates the user can no longer see.
    if (sharedCoordinates !== null) {
      setSharedCoordinates(null);
      setGeoState("idle");
    }

    if (geoMessage !== null) {
      setGeoMessage(null);
    }
  };

  const requestGeolocation = () => {
    setGeoState("locating");
    setGeoMessage(null);

    // Call directly (no await first) so iOS Safari shows the prompt.
    requestCurrentPosition().then((outcome) => {
      if (outcome.coords) {
        setSharedCoordinates(outcome.coords);
        setLocationInput("");
        setGeoState("ready");
        return;
      }
      setGeoState("error");
      setGeoMessage(t(geolocationErrorKey(outcome.error)));
    });
  };

  const clearGeolocation = () => {
    setSharedCoordinates(null);
    setGeoState("idle");
    setGeoMessage(null);
  };

  const toggleProduct = (product: string) => {
    setResumable(null);
    setSelectedProducts((current) =>
      current.includes(product)
        ? current.filter((value) => value !== product)
        : [...current, product],
    );
  };

  const resumeLastSearch = () => {
    if (!resumable) {
      return;
    }
    setSelectedProducts(resumable.products);
    setMatchMode(resumable.matchMode);
    setResumable(null);
    goToStep("results");
  };

  const startOver = () => {
    setSelectedProducts([]);
    setMatchMode("all");
    setLocationInput("");
    clearGeolocation();
    goToStep("location");
  };

  const openFarm = useCallback(
    (farm: Farm, sourceEl?: HTMLElement | null) => {
      recordView(farm.id);
      runViewTransition(() => setActiveFarm(farm), sourceEl);
    },
    [recordView],
  );

  const closeFarmSheet = useCallback(() => {
    runViewTransition(() => setActiveFarm(null));
  }, []);

  const stepSummaries: Record<QuickSearchStep, string> = {
    location: sharedCoordinates
      ? t("qs_current_location")
      : typedCoordinates
        ? locationInput.trim()
        : locationInput.trim() || t("qs_anywhere"),
    products:
      selectedProducts.length === 0
        ? t("qs_nothing_picked")
        : selectedProducts
            .slice(0, 3)
            .map((category) => tagLabel(category, locale))
            .join(", ") +
          (selectedProducts.length > 3
            ? ` +${selectedProducts.length - 3}`
            : ""),
    results:
      selectedProducts.length === 0
        ? t("qs_pick_products_first")
        : t("results_farms", { n: results.length }),
  };

  const getCardStyle = (index: number): CSSProperties => {
    const zIndex = (index + 1) * 10;

    if (index <= currentIndex) {
      const depth = currentIndex - index;

      return {
        opacity: 1,
        transform: `translateY(${index * PEEK_PX}px) scale(${1 - depth * 0.02})`,
        zIndex,
      };
    }

    return {
      opacity: 0,
      pointerEvents: "none",
      transform: "translateY(112%) scale(0.96)",
      zIndex,
    };
  };

  const renderStepBody = (stepId: QuickSearchStep) => {
    if (stepId === "location") {
      return (
        <LocationStep
          cantonOptions={cantonOptions}
          geoMessage={geoMessage}
          geoState={geoState}
          locationInput={locationInput}
          onClearGeolocation={clearGeolocation}
          onContinue={() =>
            goToStep(selectedProducts.length > 0 ? "results" : "products")
          }
          onLocationInputChange={handleLocationInputChange}
          onRequestGeolocation={requestGeolocation}
          sharedCoordinates={sharedCoordinates}
          typedCoordinates={typedCoordinates}
        />
      );
    }

    if (stepId === "products") {
      return (
        <ProductsStep
          matchCount={results.length}
          matchCounts={matchCounts}
          starterKeys={starterKeys}
          matchMode={matchMode}
          onClearSelection={() => setSelectedProducts([])}
          onMatchModeChange={setMatchMode}
          onToggleProduct={toggleProduct}
          products={products}
          selectedProducts={selectedProducts}
        />
      );
    }

    return (
      <ResultsStep
        location={location}
        matchMode={matchMode}
        onEditProducts={() => goToStep("products")}
        onMatchModeChange={setMatchMode}
        onOpenFarm={openFarm}
        results={results}
        revealKey={resultsVisit}
        selectedProducts={selectedProducts}
      />
    );
  };

  const renderStepFooter = (stepId: QuickSearchStep) => {
    if (stepId === "location") {
      // If products are already chosen (e.g. via the seasonal deep link), go
      // straight to results instead of the products step.
      const hasProducts = selectedProducts.length > 0;
      return (
        <button
          className={PRIMARY_BUTTON_CLASS}
          onClick={() => goToStep(hasProducts ? "results" : "products")}
          type="button"
        >
          {hasProducts
            ? results.length === 1
              ? t("qs_show_one")
              : results.length > 1
                ? t("qs_show_many", { n: results.length })
                : t("qs_view_results")
            : t("qs_choose_products")}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      );
    }

    if (stepId === "products") {
      return (
        <button
          className={PRIMARY_BUTTON_CLASS}
          disabled={selectedProducts.length === 0}
          onClick={() => goToStep("results")}
          type="button"
        >
          <Search className="h-4 w-4" />
          {selectedProducts.length === 0
            ? t("qs_pick_product_first")
            : results.length === 1
              ? t("qs_show_one")
              : results.length > 1
                ? t("qs_show_many", { n: results.length })
                : t("qs_view_results")}
        </button>
      );
    }

    return (
      <button className={GHOST_BUTTON_CLASS} onClick={startOver} type="button">
        <RotateCcw className="h-4 w-4" />
        {t("qs_start_over")}
      </button>
    );
  };

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-2 rounded-chip px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusPill.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-chip pulse-dot ${statusPill.dotClassName}`}
      />
      {t(statusPill.labelKey)}
    </span>
  );

  return (
    <main className="relative overflow-clip">
      <div className="lg:flex lg:h-dvh lg:overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-12 pt-4 sm:px-6 sm:pt-8 lg:mx-0 lg:flex lg:h-dvh lg:w-[560px] lg:max-w-none lg:shrink-0 lg:flex-col lg:justify-center lg:px-12 lg:py-0">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-chip border border-line bg-cloud px-3.5 py-1.5 text-xs font-semibold text-ink/60">
                <Sparkles className="h-3.5 w-3.5 text-pine" />
                {t("qs_hero_eyebrow")}
              </span>
              {serviceStatus !== "online" ? statusBadge : null}
            </div>
            <h1 className="mt-5 text-display font-extrabold leading-[0.92] tracking-[-0.045em] text-ink">
              {t("qs_hero_lead")}{" "}
              <span className="text-pine">{t("qs_hero_accent")}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-ink/60">
              {t("qs_hero_subcopy")}
            </p>
          </div>

          <QuickSearchCoach />

          {resumable ? (
            <button
              className="mt-6 inline-flex max-w-full items-center gap-2 rounded-chip border border-pine/25 bg-pine/[0.07] px-4 py-2.5 text-sm font-semibold text-pine transition-all duration-300 hover:-translate-y-0.5 hover:border-pine/40 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-pine/30"
              onClick={resumeLastSearch}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {t("qs_resume_chip", {
                  items: resumable.products
                    .slice(0, 3)
                    .map((key) => tagLabel(key, locale))
                    .join(", "),
                })}
                {resumable.products.length > 3
                  ? ` +${resumable.products.length - 3}`
                  : ""}
              </span>
            </button>
          ) : null}

          {loadError ? (
            <div
              className="mt-6 rounded-field border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
              role="status"
            >
              {t("qs_load_error")}
            </div>
          ) : null}

          <div
            aria-label={t("qs_steps_aria")}
            className="relative mt-8 scroll-mt-20 h-[clamp(520px,calc(100dvh_-_230px),820px)] lg:h-[clamp(560px,calc(100dvh_-_240px),780px)]"
            ref={deckRef}
            role="group"
          >
            {STEPS.map((meta, index) => {
              const isCurrent = index === currentIndex;
              const isStacked = index < currentIndex;
              const Icon = meta.icon;

              return (
                <article
                  aria-hidden={index > currentIndex}
                  className="glass glass-chrome absolute inset-x-0 top-0 flex h-[calc(100%-112px)] origin-top flex-col overflow-hidden rounded-panel outline-none transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                  key={meta.id}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  style={getCardStyle(index)}
                  tabIndex={-1}
                >
                  {isStacked ? (
                    <button
                      className="group flex h-14 w-full shrink-0 items-center gap-3 px-5 text-left transition hover:bg-tone/40 focus-visible:bg-tone sm:px-6"
                      onClick={() => goToStep(meta.id)}
                      type="button"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field bg-pine/10 text-pine">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="shrink-0 text-sm font-bold text-ink">
                        {t(meta.labelKey)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/60">
                        {stepSummaries[meta.id]}
                      </span>
                      <Pencil className="h-3.5 w-3.5 shrink-0 text-ink/30 transition group-hover:text-ink/70" />
                    </button>
                  ) : (
                    <div className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-[var(--glass-solid)] px-5 sm:px-6">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field bg-pine/10 text-pine">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-bold text-ink">
                        {t(meta.labelKey)}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-ink/60">
                        {t("qs_step_of", { n: index + 1 })}
                      </span>
                    </div>
                  )}

                  <div
                    aria-hidden={!isCurrent}
                    className="flex min-h-0 flex-1 flex-col"
                    inert={isCurrent ? undefined : true}
                  >
                    <div
                      className="flex-1 scroll-pt-5 overflow-y-auto px-5 pb-4 pt-5 sm:px-6"
                      data-step-scroller
                    >
                      {renderStepBody(meta.id)}
                    </div>
                    <div className="shrink-0 border-t border-line px-5 py-4 sm:px-6">
                      {renderStepFooter(meta.id)}
                    </div>
                  </div>
                </article>
              );
            })}

            {STEPS.map((meta, index) => {
              if (index === 0) {
                return null;
              }

              const isVisible = index > currentIndex;
              const enabled = isStepEnabled(index);
              const Icon = meta.icon;

              return (
                <div
                  aria-hidden={!isVisible}
                  className="absolute inset-x-0 flex h-14 items-end transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                  key={`upcoming-${meta.id}`}
                  style={{
                    bottom: (STEPS.length - 1 - index) * PEEK_PX,
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? "auto" : "none",
                    transform: isVisible ? "translateY(0)" : "translateY(14px)",
                  }}
                >
                  <button
                    className="glass-inset flex h-12 w-full items-center gap-3 rounded-field px-5 text-left transition disabled:cursor-not-allowed sm:px-6"
                    disabled={!isVisible || !enabled}
                    onClick={() => goToStep(meta.id)}
                    type="button"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-field bg-tone text-ink/70">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`text-sm font-semibold ${enabled ? "text-ink/60" : "text-ink/30"}`}
                    >
                      {t(meta.labelKey)}
                    </span>
                    <span className="ml-auto text-xs text-ink/30">
                      {enabled ? t("qs_up_next") : t("qs_pick_products_first")}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <DiscoveryPanel
          farms={farms}
          location={location}
          results={results}
          selectedProducts={selectedProducts}
          step={step}
        />
      </div>

      <div className="lg:hidden">
        <SiteFooter />
      </div>

      {activeFarm ? (
        <FarmDetailSheet
          farm={activeFarm}
          onClose={closeFarmSheet}
          selectedProducts={selectedProducts}
          viewPageQuery={`?from=quick-search${
            selectedProducts.length > 0
              ? `&products=${encodeURIComponent(selectedProducts.join(","))}`
              : ""
          }`}
        />
      ) : null}
    </main>
  );
}
