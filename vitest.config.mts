import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
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
        "lib/farms.ts",
        "lib/farm-form.ts",
        "lib/i18n.ts",
        "app/api/health/route.ts",
        "components/SeasonalCard.tsx",
        "components/ThemeToggle.tsx",
        "components/MobileTabBar.tsx",
        "components/NearestFarmCard.tsx",
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
