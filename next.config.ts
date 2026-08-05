import { execSync } from "node:child_process";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import packageJson from "./package.json";

// Resolve the deployed build's version once, at build time, and expose it to
// the client. Precedence: an explicit override, then the nearest git tag
// (clean "v1.2.3" — deploys are gated on v* tags), then the package version so
// previews never expose an opaque commit SHA, then a dev fallback.
function resolveAppVersion(): string {
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }
  try {
    // --abbrev=0 yields just the latest tag name (no "-28-gabc123-dirty" tail).
    const tag = execSync("git describe --tags --abbrev=0", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (tag) return tag;
  } catch {
    // No tags reachable (e.g. a shallow clone) — fall through.
  }
  return packageJson.version ? `v${packageJson.version}` : "dev";
}

const APP_VERSION = resolveAppVersion();

// Conservative, framework-agnostic hardening headers. We intentionally skip a
// Content-Security-Policy: the map loads OpenStreetMap tiles and Leaflet
// injects inline styles, so a strict CSP would need a fragile allowlist and
// 'unsafe-inline' — more risk than value for a public, read-mostly directory.
const securityHeaders = [
  // Browsers must not MIME-sniff responses away from the declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The app is never meant to be framed — block clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin (not the full path) on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only the nearest-farm feature needs geolocation, and only first-party.
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  // Pin HTTPS for two years, including subdomains (honored only over HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Partial Prerendering. Under the previous model a request-time API —
  // `searchParams` on the home route — opted the ENTIRE route into dynamic
  // rendering, which is why the most-visited page was the only one of 278 not
  // prerendered. With Cache Components that access is contained by its
  // <Suspense> boundary: the shell prerenders and only the filtered list
  // streams.
  cacheComponents: true,

  // Serves app/global-not-found.tsx for URLs that match no route at all. Before
  // this, that job needed an app/[lang]/[...rest] catch-all, which cannot be
  // prerendered under Cache Components — see the file's own note.
  experimental: {
    globalNotFound: true,

    // `prefetchInlining` is NOT enabled — measured, and it is a trade rather
    // than a win.
    //
    // It serves a route's static shell to a prefetch instead of a partial
    // payload. Audit #3 listed it as the follow-up to Cache Components (under
    // the name `partialPrefetching`, which is 16.3's spelling — this version
    // calls it `prefetchInlining`), reasoning that its value arrives once
    // routes have a real App Shell. They do now, so it was measured over the
    // wire against a production build:
    //
    //                  requests           over the wire
    //   /canton/be     34 -> 20  (-41%)   55.0 -> 82.3 KB  (+50%)
    //   /              29 -> 14  (-52%)   50.8 -> 85.7 KB  (+69%)
    //
    // Roughly 45% fewer requests for roughly 60% more bytes. Audit #3's case
    // for cutting prefetches was connection overhead, and it held BECAUSE each
    // payload was ~1.2 KB; a shell is 13-21 KB, which turns the same change
    // into ~+30 KB of speculative download per page view on a phone.
    //
    // Which side of that trade is right depends on whether real visitors are
    // hurt more by requests or by bytes, and there is no field data to say yet
    // — #194 shipped the vitals pipeline but it stays inert until
    // OTEL_EXPORTER_OTLP_ENDPOINT is set. Revisit then; it is one line.
    //
    // prefetchInlining: true,
  },

  // Emit a self-contained server bundle (.next/standalone/server.js) so the
  // Docker image ships only the traced runtime deps. Next 16 deliberately
  // rejects `next start` for that packaging mode, while Playwright starts the
  // app with `next start`; omit the packaging-only output for that test build.
  // Deployment builds keep the standalone server used by the Dockerfile.
  output: process.env.PLAYWRIGHT_TEST === "1" ? undefined : "standalone",
  // Inlined into the client bundle so the footer can show the deployed version.
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Run `npm run analyze` to open the bundle treemap; a no-op for normal builds.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
