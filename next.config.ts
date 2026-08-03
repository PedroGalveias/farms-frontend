import { execSync } from "node:child_process";
import { createRequire } from "node:module";
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

// Share the Next data/route cache through Redis when one is configured.
//
// Opt-in by design: with no REDIS_URL the module is never referenced and the
// default filesystem cache is used, so local dev and CI are untouched. The
// wins this buys are survival across deploys and across a sleeping backend —
// see cache-handler.mjs for the reasoning.
const cacheHandler = process.env.REDIS_URL
  ? createRequire(import.meta.url).resolve("./cache-handler.mjs")
  : undefined;

const nextConfig: NextConfig = {
  ...(cacheHandler ? { cacheHandler } : {}),
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
