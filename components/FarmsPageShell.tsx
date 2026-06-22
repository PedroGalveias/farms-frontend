"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Egg,
  Image as ImageIcon,
  MapPin,
  Plus,
  ShieldAlert,
  ShoppingBasket,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import CreateFarmDialog from "@/components/CreateFarmDialog";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import FarmCard from "@/components/FarmCard";
import NearestFarmCard from "@/components/NearestFarmCard";
import SeasonalCard from "@/components/SeasonalCard";
import SiteFooter from "@/components/SiteFooter";
import FarmDetailSheet from "@/components/quick-search/FarmDetailSheet";
import CountUp from "@/components/motion/CountUp";
import Magnetic from "@/components/motion/Magnetic";
import Reveal from "@/components/motion/Reveal";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { categoryLabel } from "@/lib/categories";
import { productGroupOf } from "@/lib/products";
import {
  getTopFarmCategories,
  getUniqueFarmCantons,
  getUniqueFarmCategories,
} from "@/lib/farms";
import type {
  DirectoryViewMode,
  Farm,
  FarmSortOption,
  ServiceStatus,
} from "@/types/farm";

interface FarmsPageShellProps {
  initialFarms: Farm[];
  loadError: string | null;
  serviceStatus: ServiceStatus;
}

const serviceStatusCopy = {
  degraded: {
    badgeClassName: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
    dotClassName: "bg-amber-500",
    icon: AlertTriangle,
    labelKey: "status_degraded",
  },
  offline: {
    badgeClassName: "bg-rose-500/10 text-rose-700 ring-rose-500/25",
    dotClassName: "bg-rose-500",
    icon: ShieldAlert,
    labelKey: "status_offline",
  },
  online: {
    badgeClassName: "bg-pine/10 text-pine ring-pine/20",
    dotClassName: "bg-pine-bright",
    icon: CheckCircle2,
    labelKey: "status_live",
  },
} as const;

const TICKER_KEYS = [
  "ticker_1",
  "ticker_2",
  "ticker_3",
  "ticker_4",
  "ticker_5",
];

// How many farm cards to render per page — keeps the DOM light when the
// directory holds thousands of farms.
const PAGE_SIZE = 24;

// Leaflet touches `window`/`document` at import time, so load it client-only and
// keep it out of the initial bundle until the map view is opened.
const FarmsMap = dynamic(() => import("@/components/FarmsMap"), {
  ssr: false,
  loading: () => (
    <div
      className="mt-6 grid place-items-center rounded-[24px] border border-line bg-tone/40 text-sm text-ink/40"
      style={{ height: "min(70vh, 640px)" }}
    >
      Loading map…
    </div>
  ),
});

function ImageSlot({
  className = "",
  icon: Icon,
  label,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      aria-hidden
      className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-tone ${className}`}
    >
      <div className="absolute inset-0 [background:radial-gradient(130%_120%_at_25%_-10%,rgba(33,160,90,0.12),transparent_60%)]" />
      <span className="relative grid h-12 w-12 place-items-center rounded-full bg-cloud text-pine shadow-[0_1px_2px_rgba(20,22,27,0.06)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="relative text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
        {label}
      </span>
    </div>
  );
}

export default function FarmsPageShell({
  initialFarms,
  loadError,
  serviceStatus,
}: FarmsPageShellProps) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLanguage();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<FarmSortOption>("newest");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // The SideRail "Add a farm" CTA links here as /#add — open the dialog when
  // that hash is present (also works when navigating in from another page).
  useEffect(() => {
    const openOnHash = () => {
      if (window.location.hash === "#add") {
        setIsCreateDialogOpen(true);
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };
    openOnHash();
    window.addEventListener("hashchange", openOnHash);
    return () => window.removeEventListener("hashchange", openOnHash);
  }, []);

  const cantonOptions = getUniqueFarmCantons(initialFarms);
  const categoryOptions = getUniqueFarmCategories(initialFarms);
  const quickCategories = getTopFarmCategories(initialFarms, 7);
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

  // Reset paging to the first page whenever the filters change — adjusting
  // state during render (React's documented pattern) avoids an effect.
  const filterKey = `${normalizedSearchTerm}|${selectedCanton}|${selectedCategory}|${sortOption}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const filteredFarms = initialFarms.filter((farm) => {
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      farm.name.toLowerCase().includes(normalizedSearchTerm) ||
      farm.address.toLowerCase().includes(normalizedSearchTerm) ||
      farm.categories.some((category) =>
        category.toLowerCase().includes(normalizedSearchTerm),
      );

    const matchesCanton =
      selectedCanton === "all" || farm.canton === selectedCanton;
    const matchesCategory =
      selectedCategory === "all" ||
      farm.categories.some(
        (category) => productGroupOf(category) === selectedCategory,
      );

    return matchesSearch && matchesCanton && matchesCategory;
  });

  const visibleFarms = [...filteredFarms].sort((leftFarm, rightFarm) => {
    if (sortOption === "name") {
      return leftFarm.name.localeCompare(rightFarm.name);
    }

    if (sortOption === "canton") {
      const byCanton = leftFarm.canton.localeCompare(rightFarm.canton);
      if (byCanton !== 0) {
        return byCanton;
      }

      return leftFarm.name.localeCompare(rightFarm.name);
    }

    return (
      new Date(rightFarm.created_at).getTime() -
      new Date(leftFarm.created_at).getTime()
    );
  });

  const activeFiltersCount = [
    searchTerm.trim().length > 0,
    selectedCanton !== "all",
    selectedCategory !== "all",
  ].filter(Boolean).length;

  const serviceStatusMeta = serviceStatusCopy[serviceStatus];

  const refreshDirectory = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const handleFarmCreated = () => {
    setIsCreateDialogOpen(false);
    refreshDirectory();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCanton("all");
    setSelectedCategory("all");
  };

  const handleQuickCategorySelection = (category: string) => {
    setSelectedCategory((currentValue) =>
      currentValue === category ? "all" : category,
    );
  };

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${serviceStatusMeta.badgeClassName}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full pulse-dot ${serviceStatusMeta.dotClassName}`}
      />
      {t(serviceStatusMeta.labelKey)}
    </span>
  );

  return (
    <div className="relative overflow-clip">
      <main className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:pt-0">
        {/* ---------- Editorial hero ---------- */}
        <section className="relative pt-10 sm:pt-14">
          <div className="grid items-stretch gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col justify-center">
              <div
                className="rise-in flex flex-wrap items-center gap-2.5"
                style={{ ["--rise-delay" as string]: "0ms" }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-3.5 py-1.5 text-xs font-semibold text-ink/60">
                  <Sparkles className="h-3.5 w-3.5 text-pine" />
                  {t("hero_eyebrow")}
                </span>
                {serviceStatus !== "online" ? statusBadge : null}
              </div>

              <h1
                className="rise-in mt-6 text-[clamp(3rem,7.5vw,5.5rem)] font-black leading-[0.9] tracking-[-0.045em] text-ink"
                style={{ ["--rise-delay" as string]: "80ms" }}
              >
                {t("hero_lead")}{" "}
                <span className="whitespace-nowrap text-pine">
                  {t("hero_accent")}
                </span>
              </h1>

              <p
                className="rise-in mt-7 max-w-md text-lg leading-8 text-ink/55"
                style={{ ["--rise-delay" as string]: "280ms" }}
              >
                {t("hero_subcopy")}
              </p>

              <div
                className="rise-in mt-9 flex flex-wrap items-center gap-3"
                style={{ ["--rise-delay" as string]: "380ms" }}
              >
                <Magnetic>
                  <Link
                    className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(20,22,27,0.7)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                    href="/quick-search"
                  >
                    {t("cta_startQuickSearch")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>

                <button
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/70 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20"
                  onClick={() => setIsCreateDialogOpen(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  {t("cta_addFarm")}
                </button>
              </div>
            </div>

            <ImageSlot
              className="rise-in min-h-[260px] rounded-[32px] lg:min-h-0"
              icon={ImageIcon}
              label={t("img_farmPhotography")}
            />
          </div>

          {/* ---------- Bento overview (informational — no duplicate CTAs) ---------- */}
          <Reveal className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:[grid-auto-rows:158px]">
            <SeasonalCard />

            <div className="flex flex-col justify-center rounded-[22px] bg-tone px-5 py-4">
              <p className="text-4xl font-black tracking-[-0.04em] text-ink">
                <CountUp value={initialFarms.length} />
              </p>
              <p className="mt-1 text-xs font-semibold text-ink/50">
                {t("bento_farmsListed")}
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-[22px] bg-tone px-5 py-4">
              <p className="text-4xl font-black tracking-[-0.04em] text-ink">
                <CountUp value={cantonOptions.length} />
              </p>
              <p className="mt-1 text-xs font-semibold text-ink/50">
                {t("bento_cantonsCovered")}
              </p>
            </div>

            <NearestFarmCard farms={initialFarms} onOpenFarm={setActiveFarm} />

            <ImageSlot
              className="min-h-[150px] rounded-[22px] sm:min-h-0"
              icon={Egg}
              label={t("bento_eggsDairy")}
            />

            <div className="flex flex-col justify-center gap-2 rounded-[22px] border border-line bg-cloud px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40">
                {t("bento_mostWanted")}
              </p>
              <p className="text-sm font-bold leading-snug text-pine">
                {quickCategories
                  .slice(0, 3)
                  .map((category) => categoryLabel(category, locale))
                  .join(" · ") || "—"}
              </p>
            </div>
          </Reveal>
        </section>

        {/* ---------- Editorial ticker ---------- */}
        <Reveal
          className="marquee mt-12 overflow-hidden border-y border-line py-3.5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
          once
        >
          <div className="marquee-track flex w-max items-center gap-6 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
            {[...TICKER_KEYS, ...TICKER_KEYS, ...TICKER_KEYS].map(
              (key, index) => (
                <span className="flex items-center gap-6" key={index}>
                  {t(key)}
                  <span aria-hidden className="text-pine">
                    •
                  </span>
                </span>
              ),
            )}
          </div>
        </Reveal>

        {/* ---------- Directory ---------- */}
        <div className="mt-16 scroll-mt-28" id="directory">
          <DirectoryToolbar
            activeFiltersCount={activeFiltersCount}
            categoryOptions={categoryOptions}
            cantonOptions={cantonOptions}
            isRefreshing={isRefreshing}
            onClearCanton={() => setSelectedCanton("all")}
            onClearCategory={() => setSelectedCategory("all")}
            onClearSearchTerm={() => setSearchTerm("")}
            onCreateFarm={() => setIsCreateDialogOpen(true)}
            onRefresh={refreshDirectory}
            onReset={resetFilters}
            onSelectQuickCategory={handleQuickCategorySelection}
            onSearchTermChange={setSearchTerm}
            onSelectedCantonChange={setSelectedCanton}
            onSelectedCategoryChange={setSelectedCategory}
            onSortOptionChange={setSortOption}
            onViewModeChange={setViewMode}
            quickCategories={quickCategories}
            resultsCount={visibleFarms.length}
            searchTerm={searchTerm}
            selectedCanton={selectedCanton}
            selectedCategory={selectedCategory}
            sortOption={sortOption}
            totalCount={initialFarms.length}
            viewMode={viewMode}
          />
        </div>

        {loadError ? (
          <section
            className="mt-6 rounded-3xl border border-amber-300/60 bg-amber-50 p-5"
            role="status"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  {t("error_heading")}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-amber-800/80">
                  {loadError}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {visibleFarms.length > 0 ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-3xl font-bold tracking-[-0.035em] text-ink">
                {t("results_farms", { n: visibleFarms.length })}
              </h2>
              <p className="text-sm text-ink/40">
                {viewMode !== "map" && visibleCount < visibleFarms.length
                  ? t("results_showing", {
                      shown: visibleCount,
                      total: visibleFarms.length,
                    })
                  : t("results_updateAsYouType")}
              </p>
            </div>

            {viewMode === "map" ? (
              <div className="mt-6">
                <FarmsMap farms={visibleFarms} onOpenFarm={setActiveFarm} />
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                      : "mt-6 flex flex-col gap-3"
                  }
                >
                  {visibleFarms.slice(0, visibleCount).map((farm, index) => (
                    <Reveal
                      delay={Math.min(index % PAGE_SIZE, 6) * 60}
                      key={farm.id}
                      style={{
                        height: viewMode === "grid" ? "100%" : undefined,
                      }}
                    >
                      <FarmCard
                        farm={farm}
                        onOpen={() => setActiveFarm(farm)}
                        variant={viewMode}
                      />
                    </Reveal>
                  ))}
                </div>

                {visibleCount < visibleFarms.length ? (
                  <div className="mt-10 flex justify-center">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-7 py-3.5 text-sm font-semibold text-ink/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20"
                      onClick={() =>
                        setVisibleCount((count) => count + PAGE_SIZE)
                      }
                      type="button"
                    >
                      {t("results_loadMore")}
                      <span className="text-ink/40">
                        {t("results_left", {
                          n: visibleFarms.length - visibleCount,
                        })}
                      </span>
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-[32px] border border-dashed border-line bg-tone/40 px-6 py-16 text-center">
            <div className="mx-auto max-w-xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pine/10 text-pine">
                <MapPin className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-ink">
                {initialFarms.length === 0
                  ? t("empty_noneAvailable")
                  : t("empty_noneMatch")}
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-ink/55">
                {initialFarms.length === 0
                  ? t("empty_noneAvailableSub")
                  : t("empty_noneMatchSub")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {initialFarms.length === 0 ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                    onClick={() => setIsCreateDialogOpen(true)}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    {t("empty_addFirst")}
                  </button>
                ) : (
                  <button
                    className="rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                    onClick={resetFilters}
                    type="button"
                  >
                    {t("empty_clearFilters")}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ---------- Full-bleed green slab ---------- */}
      <Reveal className="mt-24" once>
        <section className="relative w-full overflow-hidden bg-pine text-white">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:py-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t("slab_eyebrow")}
              </p>
              <h2 className="mt-5 max-w-md text-[clamp(2.25rem,4.5vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em]">
                {t("slab_title")}
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/65">
                {t("slab_subcopy")}
              </p>
              <div className="mt-8">
                <Link
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#14161b] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
                  href="/quick-search"
                >
                  {t("cta_startQuickSearch")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div
              aria-hidden
              className="relative flex min-h-[260px] flex-col items-center justify-center gap-3 bg-[#16713f] text-white/70 lg:min-h-[460px]"
            >
              <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_70%_-10%,rgba(255,255,255,0.12),transparent_60%)]" />
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white">
                <ShoppingBasket className="h-6 w-6" />
              </span>
              <span className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                {t("img_farmPhotography")}
              </span>
            </div>
          </div>
        </section>
      </Reveal>

      <SiteFooter />

      <CreateFarmDialog
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleFarmCreated}
        open={isCreateDialogOpen}
      />

      {activeFarm ? (
        <FarmDetailSheet
          farm={activeFarm}
          onClose={() => setActiveFarm(null)}
          selectedProducts={[]}
        />
      ) : null}
    </div>
  );
}
