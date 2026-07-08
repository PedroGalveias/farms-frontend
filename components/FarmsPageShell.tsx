"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle } from "lucide-react";
import CreateFarmDialog from "@/components/CreateFarmDialog";
import DirectoryToolbar from "@/components/DirectoryToolbar";
import SiteFooter from "@/components/SiteFooter";
import FarmDetailSheet from "@/components/quick-search/FarmDetailSheet";
import FarmQuickActions from "@/components/FarmQuickActions";
import PullToRefresh from "@/components/motion/PullToRefresh";
import BentoOverview from "@/components/home/BentoOverview";
import CantonRail from "@/components/home/CantonRail";
import DirectoryResults from "@/components/home/DirectoryResults";
import EditorialTicker from "@/components/home/EditorialTicker";
import GreenSlabCta from "@/components/home/GreenSlabCta";
import SwissBanner from "@/components/home/SwissBanner";
import HomeHero from "@/components/home/HomeHero";
import { useFarmDirectory } from "@/components/home/useFarmDirectory";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import RecentlyViewedStrip from "@/components/personalization/RecentlyViewedStrip";
import { writeCachedFarms } from "@/lib/offline-farms";
import { runViewTransition } from "@/lib/view-transitions";
import type { Farm, ServiceStatus } from "@/types/farm";

interface FarmsPageShellProps {
  initialFarms: Farm[];
  loadError: string | null;
  serviceStatus: ServiceStatus;
}

const DESKTOP_QUERY = "(min-width: 1280px)";
function subscribeToDesktopQuery(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
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
  // Farm whose long-press quick-actions sheet is open (touch).
  const [quickActionsFarm, setQuickActionsFarm] = useState<Farm | null>(null);

  // On wide screens the detail opens as a non-modal docked side panel
  // (master–detail) so the list stays put; below xl it's the modal sheet.
  // useSyncExternalStore (not an effect + state): the old effect left a
  // window right after hydration where isDesktop was still false, so a fast
  // first click on a desktop opened the MOBILE modal instead of the dock.
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

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

  // Opening a farm (sheet) also records it in the recently-viewed history. When
  // a source card is given, the open runs inside a View Transition so the card
  // morphs into the sheet.
  const openFarm = (farm: Farm, sourceEl?: HTMLElement | null) => {
    recordView(farm.id);
    // The desktop DOCK never opens inside a View Transition: while a VT runs,
    // the live DOM hides behind the old/new snapshots for its full duration,
    // which read as the panel mounting fully transparent and only "rendering"
    // half a second later. The dock has its own qs-dock-in slide; the morph
    // is for the mobile modal sheet.
    if (isDesktop) {
      setActiveFarm(farm);
      return;
    }
    // Only morph from the card on the FIRST open — the detail sheet keeps
    // `qs-farm` while mounted, so morphing again while it's open (switching
    // farms, e.g. from the docked panel) would duplicate the name and abort.
    runViewTransition(() => setActiveFarm(farm), activeFarm ? null : sourceEl);
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
    <PullToRefresh
      isRefreshing={directory.isRefreshing}
      onRefresh={directory.refreshDirectory}
    >
      <div className="relative overflow-clip">
        {/* The docked farm panel floats on its own layer above the page (no
            padding squeeze — reflowing the grid while it opens looked broken;
            the list keeps its shape and the panel slides over it). */}
        <main className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:pt-0">
          {/* ---------- Editorial hero ---------- */}
          <section className="relative pt-10 sm:pt-14">
            <HomeHero
              onAddFarm={requestAddFarm}
              serviceStatus={serviceStatus}
            />

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
              farms={initialFarms}
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

          {/* Canton browsing lives with the search tools, not buried at the
              bottom of the page — chips filter the directory in place. Kept
              OUTSIDE the #directory wrapper: the toolbar is sticky within it,
              and a sibling below would give the sticky room to travel and sit
              exactly on top of the rail. */}
          <CantonRail
            farms={initialFarms}
            onSelectCanton={directory.setSelectedCanton}
            selectedCanton={directory.selectedCanton}
          />

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
            onLongPressFarm={setQuickActionsFarm}
            onOpenFarm={openFarm}
            onResetFilters={directory.resetFilters}
            totalFarmCount={initialFarms.length}
            viewMode={directory.viewMode}
            visibleCount={directory.visibleCount}
            visibleFarms={directory.visibleFarms}
          />
        </main>

        {/* ---------- Proudly-Swiss banner (ambient WebGL flag) ---------- */}
        <SwissBanner />

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

        {quickActionsFarm ? (
          <FarmQuickActions
            farm={quickActionsFarm}
            onClose={() => setQuickActionsFarm(null)}
            onOpenDetails={(farm) => openFarm(farm)}
          />
        ) : null}
      </div>
    </PullToRefresh>
  );
}
