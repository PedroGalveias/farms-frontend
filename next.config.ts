import { execSync } from "node:child_process";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Resolve the deployed build's version once, at build time, and expose it to
// the client. Precedence: an explicit override, then the nearest git tag
// (clean "v1.2.3" — deploys are gated on v* tags), then Render's commit SHA if
// no tags are reachable, then a dev fallback.
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
  if (process.env.RENDER_GIT_COMMIT) {
    return process.env.RENDER_GIT_COMMIT.slice(0, 7);
  }
  return "dev";
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
  // Emit a self-contained server bundle (.next/standalone/server.js) so the
  // Docker image (see Dockerfile + docker-publish.yml) ships only the traced
  // runtime deps. `next start` on Render is unaffected — this only adds output.
  output: "standalone",
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
