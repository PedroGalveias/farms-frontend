import type { NextConfig } from "next";

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
