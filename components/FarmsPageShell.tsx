"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Map,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
import CreateFarmDialog from "@/components/CreateFarmDialog";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import FarmCard from "@/components/FarmCard";
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
    badgeClassName:
      "bg-amber-100/90 text-amber-900 ring-1 ring-inset ring-amber-200",
    description:
      "The farms service responding, but loading the farm data failed.",
    icon: AlertTriangle,
    label: "Service degraded",
  },
  offline: {
    badgeClassName:
      "bg-rose-100/90 text-rose-900 ring-1 ring-inset ring-rose-200",
    description:
      "The farms service is unavailable, so the frontend is operating without live data.",
    icon: ShieldAlert,
    label: "Service offline",
  },
  online: {
    badgeClassName:
      "bg-emerald-100/90 text-emerald-900 ring-1 ring-inset ring-emerald-200",
    description:
      "The farms serbive is healthy and data endpoints are responding.",
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
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("list");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const cantonOptions = getUniqueFarmCantons(initialFarms);
  const categoryOptions = getUniqueFarmCategories(initialFarms);
  const quickCategories = getTopFarmCategories(initialFarms, 7);
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
  const ServiceStatusIcon = serviceStatusMeta.icon;

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

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_top_left,rgba(233,201,107,0.24),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(159,197,214,0.3),transparent_26%),radial-gradient(circle_at_48%_35%,rgba(126,168,108,0.14),transparent_30%)]" />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[2.6rem] border border-white/60 bg-[linear-gradient(140deg,#23513e_0%,#2d6c54_36%,#87a86a_100%)] px-6 py-8 text-white shadow-[0_36px_100px_rgba(31,42,33,0.18)] sm:px-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-6 top-2 h-56 w-56 rounded-full bg-sky/25 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-20 h-48 w-48 rounded-full bg-sun/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />

          <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/78">
                <Leaf className="h-4 w-4" />
                Swiss farms
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl leading-[0.92] sm:text-6xl">
                Quick search for available products at the nearest farms.
              </h1>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <article className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                    Entries
                  </p>
                  <p className="mt-3 text-4xl font-semibold">
                    {initialFarms.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Farms ready to browse in one search-first list.
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                    Coverage
                  </p>
                  <p className="mt-3 text-4xl font-semibold">
                    {cantonOptions.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Swiss cantons represented in the directory.
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                    Quick scan
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    {quickCategories.slice(0, 2).join(" · ") || "Fresh data"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Popular categories available as one-tap shortcuts below.
                  </p>
                </article>
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4">
              <article className="rounded-[1.85rem] border border-white/12 bg-white/12 p-5 backdrop-blur">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${serviceStatusMeta.badgeClassName}`}
                >
                  <ServiceStatusIcon className="h-4 w-4" />
                  {serviceStatusMeta.label}
                </div>
                <p className="mt-4 text-sm leading-6 text-white/74">
                  {serviceStatusMeta.description}
                </p>
              </article>

              <article className="rounded-[1.85rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(233,201,107,0.18))] p-6 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/14 p-3">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="mt-3 text-3xl leading-none">
                      The directory is the homepage.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-white/78">
                      The search panel sits directly below, with large input,
                      quick category chips, and filters tuned for fast narrowing
                      instead of extra page chrome.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div className="relative z-10 -mt-4 lg:-mt-10">
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
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_18px_40px_rgba(180,122,42,0.08)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h2 className="text-lg font-semibold text-amber-950">
                  The directory could not be loaded from the backend.
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-900/85">
                  {loadError}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {visibleFarms.length > 0 ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/55">
                  Search results
                </p>
                <h2 className="mt-2 text-4xl leading-none text-forest">
                  {visibleFarms.length} farm
                  {visibleFarms.length === 1 ? "" : "s"} ready to browse
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-ink/68">
                Results update as you type, can switch between list and grid,
                and stay easy to scan on both mobile and desktop.
              </p>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {visibleFarms.map((farm) => (
                <FarmCard farm={farm} key={farm.id} variant={viewMode} />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-border bg-white/80 px-6 py-10 text-center shadow-[0_24px_60px_rgba(31,42,33,0.08)]">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 text-forest">
                <Map className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-forest/55">
                Directory state
              </p>
              <h2 className="mt-4 text-4xl leading-none text-forest">
                {initialFarms.length === 0
                  ? "No farms are available yet."
                  : "No farms match the current filters."}
              </h2>
              <p className="mt-4 text-sm leading-7 text-ink/70">
                {initialFarms.length === 0
                  ? "When the backend data is available again, new farms will appear here automatically."
                  : "Try clearing one of the filters or broadening the search term."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {initialFarms.length === 0 ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c96f3d]"
                    onClick={() => setIsCreateDialogOpen(true)}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add the first farm
                  </button>
                ) : (
                  <button
                    className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:bg-forest/5"
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

      <CreateFarmDialog
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleFarmCreated}
        open={isCreateDialogOpen}
      />
    </div>
  );
}
