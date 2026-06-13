"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Navigation,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import CreateFarmDialog from "@/components/CreateFarmDialog";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import FarmCard from "@/components/FarmCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CountUp from "@/components/motion/CountUp";
import Magnetic from "@/components/motion/Magnetic";
import Reveal from "@/components/motion/Reveal";
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
    label: "Service degraded",
  },
  offline: {
    badgeClassName: "bg-rose-500/10 text-rose-700 ring-rose-500/25",
    dotClassName: "bg-rose-500",
    icon: ShieldAlert,
    label: "Service offline",
  },
  online: {
    badgeClassName: "bg-pine/10 text-pine ring-pine/20",
    dotClassName: "bg-pine-bright",
    icon: CheckCircle2,
    label: "Service live",
  },
} as const;

export default function FarmsPageShell({
  initialFarms,
  loadError,
  serviceStatus,
}: FarmsPageShellProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<FarmSortOption>("newest");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("grid");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const cantonOptions = getUniqueFarmCantons(initialFarms);
  const categoryOptions = getUniqueFarmCategories(initialFarms);
  const quickCategories = getTopFarmCategories(initialFarms, 7);
  const marqueeCategories = getTopFarmCategories(initialFarms, 14);
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

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
      selectedCategory === "all" || farm.categories.includes(selectedCategory);

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
      {serviceStatusMeta.label}
    </span>
  );

  return (
    <div className="relative overflow-clip">
      <SiteHeader active="directory" statusBadge={statusBadge} />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* ---------- Hero ---------- */}
        <section className="relative pt-12 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span
                className="rise-in inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-3.5 py-1.5 text-xs font-semibold text-ink/60"
                style={{ ["--rise-delay" as string]: "0ms" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-pine" />
                Fresh &amp; local — straight from the source
              </span>

              <h1 className="mt-6 text-[clamp(3.25rem,9vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-ink">
                <span
                  className="rise-in block"
                  style={{ ["--rise-delay" as string]: "80ms" }}
                >
                  Fresh from
                </span>
                <span
                  className="rise-in block"
                  style={{ ["--rise-delay" as string]: "170ms" }}
                >
                  a farm{" "}
                  <span className="font-accent whitespace-nowrap font-normal text-pine">
                    near you
                  </span>
                </span>
              </h1>

              <p
                className="rise-in mt-7 max-w-md text-lg leading-8 text-ink/55"
                style={{ ["--rise-delay" as string]: "280ms" }}
              >
                Browse every farm in the directory, or use quick search to find
                a specific product at the nearest farm — sorted by distance.
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
                    Start quick search
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>

                <button
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/70 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20"
                  onClick={() => setIsCreateDialogOpen(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add a farm
                </button>
              </div>

              <dl
                className="rise-in mt-14 flex flex-wrap gap-x-10 gap-y-6"
                style={{ ["--rise-delay" as string]: "480ms" }}
              >
                <div>
                  <dt className="sr-only">Farms listed</dt>
                  <dd className="text-5xl font-extrabold tracking-[-0.04em] text-ink">
                    <CountUp value={initialFarms.length} />
                  </dd>
                  <p className="mt-1.5 text-sm text-ink/45">farms listed</p>
                </div>
                <div aria-hidden className="h-12 w-px self-end bg-line" />
                <div>
                  <dt className="sr-only">Cantons covered</dt>
                  <dd className="text-5xl font-extrabold tracking-[-0.04em] text-ink">
                    <CountUp value={cantonOptions.length} />
                  </dd>
                  <p className="mt-1.5 text-sm text-ink/45">cantons covered</p>
                </div>
                <div aria-hidden className="h-12 w-px self-end bg-line" />
                <div>
                  <dt className="sr-only">Most popular product</dt>
                  <dd className="text-5xl font-extrabold tracking-[-0.04em] text-ink">
                    {quickCategories[0] ?? "—"}
                  </dd>
                  <p className="mt-1.5 text-sm text-ink/45">most wanted</p>
                </div>
              </dl>
            </div>

            {/* Floating quick-search teaser — echoes the product. */}
            <div
              aria-hidden
              className="rise-in relative hidden h-[420px] lg:block"
              style={{ ["--rise-delay" as string]: "300ms" }}
            >
              <div className="absolute right-4 top-6 h-72 w-72 rounded-full bg-pine-bright/20 blur-3xl" />
              <div className="qs-float absolute right-0 top-2 w-[330px] rounded-[28px] border border-line bg-cloud/90 p-5 shadow-[0_40px_80px_-32px_rgba(20,22,27,0.4)] backdrop-blur-xl">
                <div className="flex items-center gap-2.5 rounded-2xl bg-tone px-4 py-3">
                  <MapPin className="h-4 w-4 text-pine" />
                  <span className="text-sm font-semibold text-ink/70">
                    Aarau, 5000
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Eggs", "Honey", "Apples"].map((label, index) => (
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        index === 0
                          ? "bg-ink text-cloud"
                          : "bg-tone text-ink/60"
                      }`}
                      key={label}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { km: "1.2 km", name: "Hofladen Binzenhof" },
                    { km: "3.8 km", name: "Eierhof Lenzburg" },
                  ].map((row) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-line bg-cloud px-4 py-3"
                      key={row.name}
                    >
                      <span className="text-sm font-semibold text-ink">
                        {row.name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-xs font-bold text-pine">
                        <Navigation className="h-3 w-3" />
                        {row.km}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Category marquee ---------- */}
        {marqueeCategories.length > 5 ? (
          <Reveal className="marquee mt-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="marquee-track flex w-max gap-3">
              {[...marqueeCategories, ...marqueeCategories].map(
                (category, index) => (
                  <span
                    className="rounded-full border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/60"
                    key={`${category}-${index}`}
                  >
                    {category}
                  </span>
                ),
              )}
            </div>
          </Reveal>
        ) : null}

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
                  The farm data could not be loaded.
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
                {visibleFarms.length} farm
                {visibleFarms.length === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-ink/40">Results update as you type.</p>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                  : "mt-6 flex flex-col gap-3"
              }
            >
              {visibleFarms.map((farm, index) => (
                <Reveal
                  delay={Math.min(index, 6) * 60}
                  key={farm.id}
                  style={{ height: viewMode === "grid" ? "100%" : undefined }}
                >
                  <FarmCard farm={farm} variant={viewMode} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-[32px] border border-dashed border-line bg-tone/40 px-6 py-16 text-center">
            <div className="mx-auto max-w-xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pine/10 text-pine">
                <MapPin className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-ink">
                {initialFarms.length === 0
                  ? "No farms are available yet."
                  : "No farms match the current filters."}
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-ink/55">
                {initialFarms.length === 0
                  ? "Farm data is unavailable at the moment. Check back soon, or add the first farm."
                  : "Try clearing one of the filters or broadening the search term."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {initialFarms.length === 0 ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                    onClick={() => setIsCreateDialogOpen(true)}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add the first farm
                  </button>
                ) : (
                  <button
                    className="rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                    onClick={resetFilters}
                    type="button"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ---------- Full-bleed dark CTA ---------- */}
      <Reveal className="mt-24 px-5 sm:px-8" once>
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-ink px-8 py-16 text-cloud sm:px-14 sm:py-20">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-pine-bright/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-pine/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
              Know a farm we&apos;re{" "}
              <span className="font-accent font-normal text-pine-bright">
                missing?
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-cloud/60">
              Put it on the map in under a minute. A canton, a set of
              coordinates, and the products it sells — that&apos;s all it takes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                className="group inline-flex items-center gap-2 rounded-full bg-cloud px-7 py-4 text-sm font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cloud/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                onClick={() => setIsCreateDialogOpen(true)}
                type="button"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                Add a farm
              </button>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-cloud/20 px-6 py-4 text-sm font-semibold text-cloud/80 transition-all duration-300 hover:border-cloud/40 hover:text-cloud active:scale-[0.98]"
                href="/quick-search"
              >
                Try quick search
                <ArrowRight className="h-4 w-4" />
              </Link>
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
    </div>
  );
}
