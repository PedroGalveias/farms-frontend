"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent,
} from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Leaf,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { formatFarmDate, getCantonName } from "@/lib/farms";
import {
  formatQuickSearchDistance,
  getQuickSearchProducts,
  getQuickSearchResults,
  parseQuickSearchCoordinates,
  type QuickSearchLocation,
} from "@/lib/quick-search";
import type { Farm, ServiceStatus } from "@/types/farm";

type QuickSearchStep = "location" | "products" | "loading" | "results";
type GeoState = "idle" | "locating" | "ready" | "error";

interface QuickSearchExperienceProps {
  farms: Farm[];
  loadError: string | null;
  serviceStatus: ServiceStatus;
}

const stepOrder: QuickSearchStep[] = ["location", "products", "results"];

const leafGradients = [
  "bg-[linear-gradient(150deg,#7bcf6d_0%,#2d8b58_54%,#1f5f45_100%)]",
  "bg-[linear-gradient(150deg,#f6cf73_0%,#d7a54c_40%,#83b165_100%)]",
  "bg-[linear-gradient(150deg,#9bc4d6_0%,#6fb28f_45%,#2c7456_100%)]",
] as const;

function getStepIndex(step: QuickSearchStep) {
  if (step === "location") {
    return 0;
  }

  if (step === "products") {
    return 1;
  }

  return 2;
}

export default function QuickSearchExperience({
  farms,
  loadError,
  serviceStatus,
}: QuickSearchExperienceProps) {
  const [step, setStep] = useState<QuickSearchStep>("location");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [locationInput, setLocationInput] = useState("");
  const [sharedCoordinates, setSharedCoordinates] =
    useState<QuickSearchLocation["coordinates"]>(null);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [isStepPending, startStepTransition] = useTransition();
  const dragStartYRef = useRef<number | null>(null);

  const availableProducts = getQuickSearchProducts(farms);

  const quickSearchLocation: QuickSearchLocation = {
    coordinates:
      sharedCoordinates ?? parseQuickSearchCoordinates(locationInput.trim()),
    label:
      sharedCoordinates && locationInput.trim().length === 0
        ? "Near your current location"
        : locationInput.trim(),
  };

  const quickSearchResults = getQuickSearchResults({
    farms,
    location: quickSearchLocation,
    selectedProducts,
  });

  const currentIndex = getStepIndex(step);
  const canMovePastLocation =
    locationInput.trim().length > 0 || sharedCoordinates !== null;
  const canMovePastProducts = selectedProducts.length > 0;

  useEffect(() => {
    if (step !== "loading") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      startStepTransition(() => {
        setStep("results");
      });
    }, 1700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [step, startStepTransition]);

  const moveToStep = (
    nextStep: QuickSearchStep,
    nextDirection: "forward" | "backward",
  ) => {
    setDirection(nextDirection);
    startStepTransition(() => {
      setStep(nextStep);
    });
  };

  const openFarmSheet = (farm: Farm) => {
    dragStartYRef.current = null;
    setSheetOffset(0);
    setIsDraggingSheet(false);
    setActiveFarm(farm);
  };

  const closeFarmSheet = () => {
    dragStartYRef.current = null;
    setSheetOffset(0);
    setIsDraggingSheet(false);
    setActiveFarm(null);
  };

  const handleNext = () => {
    if (step === "location" && canMovePastLocation) {
      moveToStep("products", "forward");
    } else if (step === "products" && canMovePastProducts) {
      moveToStep("loading", "forward");
    }
  };

  const handleBack = () => {
    if (step === "products") {
      moveToStep("location", "backward");
    } else if (step === "results") {
      closeFarmSheet();
      moveToStep("products", "backward");
    }
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts((currentProducts) =>
      currentProducts.includes(product)
        ? currentProducts.filter((currentProduct) => currentProduct !== product)
        : [...currentProducts, product],
    );
  };

  const requestBrowserLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("error");
      setGeoMessage(
        "Geolocation is not available. You can type a town, ZIP code, or coordinates instead.",
      );
      return;
    }

    setGeoState("locating");
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSharedCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoState("ready");
        setGeoMessage("Using your browser location.");
      },
      () => {
        setGeoState("error");
        setGeoMessage(
          "We could not access your location. You can still type a place or coordinates.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 10000,
      },
    );
  };

  const clearBrowserLocation = () => {
    setSharedCoordinates(null);
    setGeoState("idle");
    setGeoMessage(null);
  };

  const handleSheetPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    setIsDraggingSheet(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) {
      return;
    }

    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    setSheetOffset(nextOffset);
  };

  const finishSheetDrag = () => {
    if (sheetOffset > 120) {
      closeFarmSheet();
    } else {
      setSheetOffset(0);
    }

    dragStartYRef.current = null;
    setIsDraggingSheet(false);
  };

  const getLeafPlacement = (leafIndex: number) => {
    const isCurrent = leafIndex === currentIndex;
    const isPast = leafIndex < currentIndex;

    if (isCurrent) {
      return "translate-y-0 scale-100 opacity-100 z-30";
    }

    if (isPast) {
      return leafIndex === currentIndex - 1
        ? "translate-y-8 scale-[0.95] opacity-90 z-20"
        : "translate-y-14 scale-[0.9] opacity-70 z-10";
    }

    return direction === "forward"
      ? "translate-y-20 scale-[0.86] opacity-0 z-0"
      : "-translate-y-14 scale-[0.88] opacity-0 z-0";
  };

  const serviceLabel =
    serviceStatus === "online"
      ? "Live farm data"
      : serviceStatus === "degraded"
        ? "Service degraded"
        : "Offline data state";

  const renderLocationLeaf = () => (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Step 1
        </p>
        <h2 className="mt-4 text-4xl leading-none sm:text-[2.7rem]">
          Where should we search?
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/78">
          Type a town, ZIP code, canton, or coordinates. You can also share your
          browser location to rank farms by distance.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-white/82">Location</span>
          <div className="relative mt-2">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
            <input
              className="w-full rounded-[1.6rem] border border-white/18 bg-white/14 py-4 pl-12 pr-4 text-base text-white placeholder:text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur focus:border-white/35 focus:outline-none"
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Aarau, AG or 47.3925, 8.0457"
              value={locationInput}
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/22"
            onClick={requestBrowserLocation}
            type="button"
          >
            <Navigation className="h-4 w-4" />
            {geoState === "locating" ? "Locating..." : "Use browser location"}
          </button>

          {sharedCoordinates ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
              onClick={clearBrowserLocation}
              type="button"
            >
              <X className="h-4 w-4" />
              Clear shared location
            </button>
          ) : null}
        </div>

        {geoMessage ? (
          <div className="rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-3 text-sm text-white/84">
            {geoMessage}
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-end gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-[#f7f9f2] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canMovePastLocation || isStepPending}
          onClick={handleNext}
          type="button"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderProductsLeaf = () => (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          Step 2
        </p>
        <h2 className="mt-4 text-4xl leading-none sm:text-[2.7rem]">
          What are you after today?
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/80">
          Pick one or more product categories. We will look for farms that match
          all of them.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 overflow-y-auto pr-1">
        {availableProducts.map((product) => {
          const isSelected = selectedProducts.includes(product);

          return (
            <button
              className={`rounded-[1.4rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                isSelected
                  ? "border-white/30 bg-white text-forest shadow-[0_12px_28px_rgba(21,57,44,0.18)]"
                  : "border-white/18 bg-white/12 text-white hover:bg-white/18"
              }`}
              key={product}
              onClick={() => toggleProduct(product)}
              type="button"
            >
              {product}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-3 text-sm text-white/84">
        {selectedProducts.length > 0
          ? `${selectedProducts.length} product categories selected.`
          : "Choose at least one product category to continue."}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/18"
          onClick={handleBack}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <button
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-[#fff8ef] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canMovePastProducts || isStepPending}
          onClick={handleNext}
          type="button"
        >
          Search farms
          <Search className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderResultsLeaf = () => {
    if (step === "loading") {
      return (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Step 3
            </p>
            <h2 className="mt-4 text-4xl leading-none sm:text-[2.7rem]">
              Gathering farms
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              We are checking for farms that match your selected products and
              location.
            </p>
          </div>

          <div className="relative mt-10 flex flex-1 items-center justify-center">
            <div className="absolute inset-x-4 top-12 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative h-56 w-full max-w-[260px]">
              <div className="quick-search-wind-leaf absolute left-2 top-12 h-16 w-16 rounded-[64%_36%_56%_44%/48%_60%_40%_52%] bg-white/26" />
              <div className="quick-search-wind-leaf absolute left-16 top-24 h-10 w-10 rounded-[64%_36%_56%_44%/48%_60%_40%_52%] bg-sun/40" />
              <div className="quick-search-wind-leaf absolute right-12 top-10 h-14 w-14 rounded-[64%_36%_56%_44%/48%_60%_40%_52%] bg-white/18" />
              <div className="quick-search-wind-leaf absolute bottom-8 right-4 h-12 w-12 rounded-[64%_36%_56%_44%/48%_60%_40%_52%] bg-accent/32" />
            </div>
          </div>

          <div className="mt-auto rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-3 text-sm text-white/84">
            Looking for {selectedProducts.join(", ")} near{" "}
            {quickSearchLocation.label || "your selected area"}.
          </div>
        </>
      );
    }

    return (
      <>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Results
          </p>
          <h2 className="mt-4 text-4xl leading-none sm:text-[2.7rem]">
            {quickSearchResults.length > 0
              ? "Pick a farm"
              : "No farms found yet"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/80">
            {quickSearchResults.length > 0
              ? "Tap a farm to open its detail sheet. You can drag the sheet down to close it."
              : "Try changing location or product categories and search again."}
          </p>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {quickSearchResults.length > 0 ? (
            <div className="space-y-3">
              {quickSearchResults.map((result) => (
                <button
                  className="w-full rounded-[1.5rem] border border-white/16 bg-white/14 px-4 py-4 text-left text-white transition hover:bg-white/20"
                  key={result.farm.id}
                  onClick={() => openFarmSheet(result.farm)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/62">
                        {result.farm.canton} ·{" "}
                        {getCantonName(result.farm.canton)}
                      </p>
                      <h3 className="mt-2 text-2xl leading-none">
                        {result.farm.name}
                      </h3>
                    </div>

                    <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/88">
                      Open
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/80">
                    {result.farm.address}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.matchedProducts.map((product) => (
                      <span
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-forest"
                        key={product}
                      >
                        {product}
                      </span>
                    ))}
                  </div>

                  {formatQuickSearchDistance(result.distanceKm) ? (
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/68">
                      {formatQuickSearchDistance(result.distanceKm)}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/16 bg-white/12 px-4 py-5 text-sm leading-7 text-white/82">
              No farms match all of the selected categories right now.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/18"
            onClick={handleBack}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-[#f7fbf1]"
            onClick={() => moveToStep("location", "backward")}
            type="button"
          >
            Start over
          </button>
        </div>
      </>
    );
  };

  const renderLeafContent = (leafStep: QuickSearchStep) => {
    if (leafStep === "location") {
      return renderLocationLeaf();
    }

    if (leafStep === "products") {
      return renderProductsLeaf();
    }

    return renderResultsLeaf();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(233,201,107,0.2),transparent_24%),radial-gradient(circle_at_top_right,rgba(159,197,214,0.2),transparent_24%),linear-gradient(180deg,#fbf9f0_0%,#f1ecde_100%)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.54))] px-4 py-5 shadow-[0_28px_90px_rgba(31,42,33,0.12)] backdrop-blur sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(123,207,109,0.18),transparent_46%)]" />
          <div className="pointer-events-none absolute -bottom-8 left-0 h-40 w-40 rounded-full bg-sun/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-8 h-36 w-36 rounded-full bg-sky/22 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-forest shadow-[0_10px_24px_rgba(31,42,33,0.08)] transition hover:bg-white"
                href="/"
              >
                <ArrowLeft className="h-4 w-4" />
                Directory
              </Link>

              <div className="inline-flex items-center gap-2 rounded-full bg-forest px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                <Leaf className="h-4 w-4" />
                Quick search
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-forest/60">
                Fast product lookup
              </p>
              <h1 className="mt-4 text-4xl leading-none text-forest sm:text-5xl">
                Find farms for exactly what you need.
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/72 sm:text-lg">
                A quick, leaf-by-leaf flow for finding nearby farms by product,
                centered on the page and designed to work cleanly on both
                desktop and mobile.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-forest shadow-[0_10px_24px_rgba(31,42,33,0.06)]">
                {serviceLabel}
              </div>
              <div className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-semibold text-forest shadow-[0_10px_24px_rgba(31,42,33,0.06)]">
                {step === "loading"
                  ? "Searching farms"
                  : `${currentIndex + 1} of 3 steps`}
              </div>
            </div>
          </div>
        </header>

        {loadError ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            The farm data is not fully available right now. You can still
            explore the flow, but live results may be limited.
          </div>
        ) : null}

        <section className="relative mt-6 overflow-hidden rounded-[2.3rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.44))] p-4 shadow-[0_28px_90px_rgba(31,42,33,0.12)] backdrop-blur sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(123,207,109,0.16),transparent_45%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-sun/18 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-16 h-48 w-48 rounded-full bg-sky/20 blur-3xl" />

          <div className="relative z-10 flex min-h-[calc(100vh-12rem)] flex-col justify-between sm:min-h-[760px]">
            <div className="px-1">
              <p className="text-center text-sm font-medium text-forest/70">
                A playful quick-search flow centered around the animated leaves.
              </p>
            </div>

            <div className="relative mt-5 h-[520px] sm:h-[580px] lg:h-[620px]">
              {stepOrder.map((leafStep, leafIndex) => (
                <div
                  className={`quick-search-leaf absolute inset-x-1 top-0 mx-auto h-[500px] w-full max-w-[370px] rounded-[58%_42%_55%_45%/46%_62%_38%_54%] ${leafGradients[leafIndex]} p-5 text-white shadow-[0_24px_80px_rgba(31,42,33,0.22)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[540px] sm:max-w-[400px] sm:p-6 lg:h-[560px] lg:max-w-[420px] ${getLeafPlacement(leafIndex)}`}
                  key={leafStep}
                >
                  <div className="quick-search-leaf-vein absolute inset-y-8 left-1/2 w-[2px] -translate-x-1/2 bg-white/18" />
                  <div className="pointer-events-none absolute left-10 top-12 h-20 w-20 rounded-full bg-white/12 blur-2xl" />
                  <div className="pointer-events-none absolute bottom-12 right-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative flex h-full -rotate-[5deg] flex-col">
                    {renderLeafContent(leafStep)}
                  </div>
                </div>
              ))}
            </div>

            <footer className="relative z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] bg-white/72 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-forest/72 shadow-[0_12px_24px_rgba(31,42,33,0.08)] sm:rounded-full">
              <span>
                {step === "loading" ? "Searching" : `${currentIndex + 1} / 3`}
              </span>
              <span>{serviceLabel}</span>
            </footer>
          </div>
        </section>

        {activeFarm ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 pt-10 sm:px-6 sm:pb-6">
            <button
              aria-label="Close farm detail sheet"
              className="absolute inset-0 bg-forest/32 backdrop-blur-[2px]"
              onClick={closeFarmSheet}
              type="button"
            />

            <div
              className={`quick-search-sheet relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-surface px-5 pb-8 pt-4 shadow-[0_-18px_56px_rgba(31,42,33,0.18)] sm:px-6 ${isDraggingSheet ? "" : "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
              style={{ transform: `translateY(${sheetOffset}px)` }}
            >
              <div
                className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-forest/14"
                onPointerCancel={finishSheetDrag}
                onPointerDown={handleSheetPointerDown}
                onPointerMove={handleSheetPointerMove}
                onPointerUp={finishSheetDrag}
                role="presentation"
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-forest/55">
                    {activeFarm.canton} · {getCantonName(activeFarm.canton)}
                  </p>
                  <h2 className="mt-3 text-4xl leading-none text-forest">
                    {activeFarm.name}
                  </h2>
                </div>

                <button
                  className="rounded-full bg-forest/8 p-2 text-forest transition hover:bg-forest/12"
                  onClick={closeFarmSheet}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm text-ink/78">
                <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4 shadow-[0_12px_26px_rgba(31,42,33,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/55">
                    Address
                  </p>
                  <p className="mt-2 leading-7">{activeFarm.address}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4 shadow-[0_12px_26px_rgba(31,42,33,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/55">
                      Coordinates
                    </p>
                    <p className="mt-2 leading-7">{activeFarm.coordinates}</p>
                  </div>

                  <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4 shadow-[0_12px_26px_rgba(31,42,33,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/55">
                      Added
                    </p>
                    <p className="mt-2 leading-7">
                      {formatFarmDate(activeFarm.created_at)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-border bg-white px-4 py-4 shadow-[0_12px_26px_rgba(31,42,33,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forest/55">
                    Categories
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeFarm.categories.map((category) => (
                      <span
                        className="rounded-full bg-[linear-gradient(135deg,rgba(126,168,108,0.16),rgba(233,201,107,0.24))] px-3 py-1 text-sm font-semibold text-forest"
                        key={category}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
