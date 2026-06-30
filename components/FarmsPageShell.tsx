"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import CreateFarmDialog from "@/components/CreateFarmDialog";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import SiteFooter from "@/components/SiteFooter";
import FarmDetailSheet from "@/components/quick-search/FarmDetailSheet";
import BentoOverview from "@/components/home/BentoOverview";
import DirectoryResults from "@/components/home/DirectoryResults";
import EditorialTicker from "@/components/home/EditorialTicker";
import GreenSlabCta from "@/components/home/GreenSlabCta";
import HomeHero from "@/components/home/HomeHero";
import { useFarmDirectory } from "@/components/home/useFarmDirectory";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import RecentlyViewedStrip from "@/components/personalization/RecentlyViewedStrip";
import { writeCachedFarms } from "@/lib/offline-farms";
import type { Farm, ServiceStatus } from "@/types/farm";

interface FarmsPageShellProps {
  initialFarms: Farm[];
  loadError: string | null;
  serviceStatus: ServiceStatus;
}

export default function FarmsPageShell({
  initialFarms,
  loadError,
  serviceStatus,
}: FarmsPageShellProps) {
  const t = useT();
  const { recordView } = usePersonalization();
  const { user, openAuth } = useAuth();
  const directory = useFarmDirectory(initialFarms);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);

  // On wide screens the detail opens as a non-modal docked side panel
  // (master–detail) so the list stays put; below xl it's the modal sheet.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(query.matches);
    queueMicrotask(update);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const detailDocked = activeFarm !== null && isDesktop;

  useEffect(() => {
    writeCachedFarms(initialFarms);
  }, [initialFarms]);

  // Adding a farm requires an account: open the create dialog when signed in,
  // otherwise prompt login with a contextual notice.
  const requestAddFarm = () => {
    if (user) {
      setIsCreateDialogOpen(true);
    } else {
      openAuth("login", "auth_login_required");
    }
  };

  // Opening a farm (sheet) also records it in the recently-viewed history.
  const openFarm = (farm: Farm) => {
    recordView(farm.id);
    setActiveFarm(farm);
  };

  const handleFarmCreated = () => {
    setIsCreateDialogOpen(false);
    directory.refreshDirectory();
  };

  // The SideRail "Add a farm" CTA links here as /#add — open the dialog when
  // that hash is present (also works when navigating in from another page).
  useEffect(() => {
    const openOnHash = () => {
      if (window.location.hash === "#add") {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        requestAddFarm();
      }
    };
    openOnHash();
    window.addEventListener("hashchange", openOnHash);
    return () => window.removeEventListener("hashchange", openOnHash);
    // requestAddFarm reads the latest user via closure on each invocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="relative overflow-clip">
      <main
        className={`mx-auto max-w-6xl px-5 pt-6 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 lg:pt-0 ${
          detailDocked ? "xl:pr-[27rem]" : ""
        }`}
      >
        {/* ---------- Editorial hero ---------- */}
        <section className="relative pt-10 sm:pt-14">
          <HomeHero onAddFarm={requestAddFarm} serviceStatus={serviceStatus} />

          {/* ---------- Bento overview (informational — no duplicate CTAs) ---------- */}
          <BentoOverview
            cantonCount={directory.cantonOptions.length}
            farms={initialFarms}
            mostWanted={directory.mostWanted}
            onOpenFarm={openFarm}
          />
        </section>

        {/* ---------- Editorial ticker ---------- */}
        <EditorialTicker />

        {/* ---------- Recently viewed ---------- */}
        <RecentlyViewedStrip farms={initialFarms} />

        {/* ---------- Directory ---------- */}
        <div className="mt-16 scroll-mt-28" id="directory">
          <DirectoryToolbar
            activeFiltersCount={directory.activeFiltersCount}
            cantonCounts={directory.cantonCounts}
            cantonRegions={directory.cantonRegions}
            categoryCounts={directory.categoryCounts}
            categoryMatchMode={directory.categoryMatchMode}
            categoryOptions={directory.orderedCategoryOptions}
            isLocating={directory.isLocating}
            isRefreshing={directory.isRefreshing}
            locationActive={directory.originCoords !== null}
            locationError={directory.locationError}
            onCategoryMatchModeChange={directory.setCategoryMatchMode}
            onClearCanton={() => directory.setSelectedCanton("all")}
            onClearLocation={directory.clearLocation}
            onClearSearchTerm={() => directory.setSearchTerm("")}
            onCreateFarm={requestAddFarm}
            onRadiusChange={directory.setRadiusKm}
            onRefresh={directory.refreshDirectory}
            onReset={directory.resetFilters}
            onSearchTermChange={directory.setSearchTerm}
            onSelectedCantonChange={directory.setSelectedCanton}
            onSortOptionChange={directory.setSortOption}
            onToggleCategory={directory.toggleCategory}
            onUseLocation={directory.locateMe}
            onViewModeChange={directory.setViewMode}
            radiusKm={directory.radiusKm}
            resultsCount={directory.visibleFarms.length}
            searchTerm={directory.searchTerm}
            selectedCanton={directory.selectedCanton}
            selectedCategories={directory.selectedCategories}
            sortOption={directory.effectiveSort}
            totalCount={initialFarms.length}
            viewMode={directory.viewMode}
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

        <DirectoryResults
          distanceByFarmId={directory.distanceByFarmId}
          onAddFarm={requestAddFarm}
          onLoadMore={directory.loadMore}
          onOpenFarm={openFarm}
          onResetFilters={directory.resetFilters}
          totalFarmCount={initialFarms.length}
          viewMode={directory.viewMode}
          visibleCount={directory.visibleCount}
          visibleFarms={directory.visibleFarms}
        />
      </main>

      {/* ---------- Full-bleed green slab ---------- */}
      <GreenSlabCta />

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
          variant={isDesktop ? "dock" : "modal"}
        />
      ) : null}
    </div>
  );
}
