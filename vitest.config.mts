import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves tsconfig `paths` (the `@/*` alias) natively, so the
  // vite-tsconfig-paths plugin is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    // e2e/ is Playwright's territory — keep Vitest out of it.
    exclude: ["node_modules", ".next", "dist", "e2e/**"],
    coverage: {
      provider: "v8",
      // text/text-summary for the CI log; json + json-summary feed the PR
      // coverage-report comment; html is the browsable local report.
      reporter: ["text", "text-summary", "json", "json-summary", "html"],
      // Scope coverage to the modules that are actually under test so the
      // percentage is meaningful and the thresholds below are enforceable.
      // Presentational/animation components are excluded until they get tests.
      include: [
        "lib/quick-search.ts",
        "lib/categories.ts",
        "lib/products.ts",
        "lib/seasonal.ts",
        "lib/geolocation.ts",
        "lib/farms.ts",
        "lib/map.ts",
        "lib/directory.ts",
        "lib/share.ts",
        "lib/personalization.ts",
        "lib/search-stats.ts",
        "lib/collections.ts",
        "lib/farm-form.ts",
        "lib/export.ts",
        "lib/directions.ts",
        "lib/offline-farms.ts",
        "lib/haptics.ts",
        "lib/i18n.ts",
        "app/api/health/route.ts",
        "components/SeasonalCard.tsx",
        "components/ThemeToggle.tsx",
        "components/MobileTabBar.tsx",
        "components/NearestFarmCard.tsx",
        "components/GoBackButton.tsx",
        "components/CopyButton.tsx",
        "components/ShareButton.tsx",
        "components/personalization/RecentlyViewedStrip.tsx",
        "components/saved/SavedView.tsx",
        "components/home/useFarmDirectory.ts",
        "components/theme/ThemeProvider.tsx",
        "components/i18n/LanguageProvider.tsx",
      ],
      // CI fails if coverage of the scoped code regresses below these floors.
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
});
