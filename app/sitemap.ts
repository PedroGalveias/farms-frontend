import type { MetadataRoute } from "next";
import { getFarms } from "@/lib/farms-service";
import { SWISS_CANTONS, getRegionKeys } from "@/lib/farms";
import { getProductSlugs } from "@/lib/product-pages";
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
    { url: `${siteUrl}/canton`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/product`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/seasonal`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/saved`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Canton + region landing pages — the internal-link web into the directory.
  const cantonRoutes: MetadataRoute.Sitemap = SWISS_CANTONS.map((canton) => ({
    url: `${siteUrl}/canton/${canton.code.toLowerCase()}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const regionRoutes: MetadataRoute.Sitemap = getRegionKeys().map((key) => ({
    url: `${siteUrl}/region/${key}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  // Product landing pages — the second axis of the internal-link web.
  const productRoutes: MetadataRoute.Sitemap = getProductSlugs().map(
    (slug) => ({
      url: `${siteUrl}/product/${slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );
  staticRoutes.push(...cantonRoutes, ...regionRoutes, ...productRoutes);

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
