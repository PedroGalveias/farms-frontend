/**
 * Absolute site origin (no trailing slash) used for canonical URLs, the
 * sitemap, robots, and JSON-LD. Set NEXT_PUBLIC_SITE_URL in production;
 * localhost is the development fallback.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
