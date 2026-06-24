import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    // /verify-email is a single-use token landing page — nothing to index.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/verify-email"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
