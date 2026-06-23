import type { MetadataRoute } from "next";
import { getFarms } from "@/lib/farms-service";
import { getSiteUrl } from "@/lib/site";

// Refresh the sitemap hourly rather than per-request; the farm list changes
// rarely and crawlers don't need second-level freshness.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/quick-search`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${siteUrl}/seasonal`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/saved`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const farms = await getFarms();
    const farmRoutes: MetadataRoute.Sitemap = farms.map((farm) => ({
      url: `${siteUrl}/farm/${encodeURIComponent(farm.id)}`,
      lastModified: farm.updated_at ?? farm.created_at,
      changeFrequency: "monthly",
      priority: 0.5,
    }));
    return [...staticRoutes, ...farmRoutes];
  } catch {
    // Backend unavailable — still serve the static routes.
    return staticRoutes;
  }
}
