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
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { KNOWN_CATEGORY_KEYS, categoryLabel } from "@/lib/categories";
import { geolocationErrorKey, requestCurrentPosition } from "@/lib/geolocation";
import { getCantonName, getUniqueFarmCantons } from "@/lib/farms";
import { runViewTransition } from "@/lib/view-transition";
import {
  getQuickSearchProducts,
  getQuickSearchResults,
  parseQuickSearchCoordinates,
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
  "group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none";

const GHOST_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/75 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20";

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

  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const hasMountedRef = useRef(false);

  const products = useMemo(() => getQuickSearchProducts(farms), [farms]);

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

  const currentIndex = STEPS.findIndex((meta) => meta.id === step);
  const statusPill = SERVICE_STATUS_PILLS[serviceStatus];

  // Deep link (e.g. the home "in season" card): ?products=Group1,Group2
  // pre-selects those category groups, so the visitor lands ready to share
  // their location and see those farms nearest-first.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("products");
    if (!raw) {
      return;
    }
    const groups = raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => KNOWN_CATEGORY_KEYS.includes(value));
    if (groups.length > 0) {
      // Defer out of the effect body (repo lint: no sync setState in effects).
      queueMicrotask(() => setSelectedProducts(groups));
    }
  }, []);

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
    }

    setStep(nextStep);
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
    setSelectedProducts((current) =>
      current.includes(product)
        ? current.filter((value) => value !== product)
        : [...current, product],
    );
  };

  const startOver = () => {
    setSelectedProducts([]);
    setMatchMode("all");
    setLocationInput("");
    clearGeolocation();
    goToStep("location");
  };

  const openFarm = useCallback((farm: Farm, sourceEl?: HTMLElement | null) => {
    runViewTransition(() => setActiveFarm(farm), sourceEl);
  }, []);

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
            .map((category) => categoryLabel(category, locale))
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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusPill.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full pulse-dot ${statusPill.dotClassName}`}
      />
      {t(statusPill.labelKey)}
    </span>
  );

  return (
    <div className="relative overflow-clip">
      <div className="lg:flex lg:h-dvh lg:overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-12 pt-4 sm:px-6 sm:pt-8 lg:mx-0 lg:flex lg:h-dvh lg:w-[560px] lg:max-w-none lg:shrink-0 lg:flex-col lg:justify-center lg:px-12 lg:py-0">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-3.5 py-1.5 text-xs font-semibold text-ink/60">
                <Sparkles className="h-3.5 w-3.5 text-pine" />
                {t("qs_hero_eyebrow")}
              </span>
              {serviceStatus !== "online" ? statusBadge : null}
            </div>
            <h1 className="mt-5 text-[clamp(2.75rem,11vw,4rem)] font-extrabold leading-[0.92] tracking-[-0.045em] text-ink">
              {t("qs_hero_lead")}{" "}
              <span className="text-pine">{t("qs_hero_accent")}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-ink/55">
              {t("qs_hero_subcopy")}
            </p>
          </div>

          {loadError ? (
            <div
              className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
              role="status"
            >
              {t("qs_load_error")}
            </div>
          ) : null}

          <div
            aria-label={t("qs_steps_aria")}
            className="relative mt-8 h-[clamp(460px,calc(100dvh-400px),640px)] lg:h-[clamp(520px,calc(100dvh-360px),660px)]"
            role="group"
          >
            {STEPS.map((meta, index) => {
              const isCurrent = index === currentIndex;
              const isStacked = index < currentIndex;
              const Icon = meta.icon;

              return (
                <article
                  aria-hidden={index > currentIndex}
                  className="absolute inset-x-0 top-0 flex h-[calc(100%-112px)] origin-top flex-col overflow-hidden rounded-[32px] border border-line bg-cloud shadow-[0_1px_2px_rgba(20,22,27,0.05),0_36px_64px_-24px_rgba(20,22,27,0.3)] outline-none transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="shrink-0 text-sm font-bold text-ink">
                        {t(meta.labelKey)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/45">
                        {stepSummaries[meta.id]}
                      </span>
                      <Pencil className="h-3.5 w-3.5 shrink-0 text-ink/30 transition group-hover:text-ink/70" />
                    </button>
                  ) : (
                    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5 sm:px-6">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-bold text-ink">
                        {t(meta.labelKey)}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-ink/35">
                        {t("qs_step_of", { n: index + 1 })}
                      </span>
                    </div>
                  )}

                  <div
                    aria-hidden={!isCurrent}
                    className="flex min-h-0 flex-1 flex-col"
                    inert={isCurrent ? undefined : true}
                  >
                    <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5 sm:px-6">
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
                    className="flex h-12 w-full items-center gap-3 rounded-2xl border border-line bg-cloud/60 px-5 text-left transition enabled:hover:bg-cloud disabled:cursor-not-allowed sm:px-6"
                    disabled={!isVisible || !enabled}
                    onClick={() => goToStep(meta.id)}
                    type="button"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-tone text-ink/40">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`text-sm font-semibold ${enabled ? "text-ink/55" : "text-ink/30"}`}
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

        <DiscoveryPanel step={step} selectedProducts={selectedProducts} />
      </div>

      <div className="lg:hidden">
        <SiteFooter />
      </div>

      {activeFarm ? (
        <FarmDetailSheet
          farm={activeFarm}
          onClose={closeFarmSheet}
          selectedProducts={selectedProducts}
        />
      ) : null}
    </div>
  );
}
