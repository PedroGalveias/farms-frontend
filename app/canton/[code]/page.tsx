import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CantonView, { type CantonSibling } from "@/components/canton/CantonView";
import { getFarms } from "@/lib/farms-service";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";
import {
  SWISS_CANTONS,
  getCantonName,
  getCantonsInRegion,
  getRegionKeyForCanton,
  getTopFarmCategories,
  isValidCantonCode,
} from "@/lib/farms";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

// Pre-render every canton at build time; the list changes rarely.
export const revalidate = 3600;

export function generateStaticParams() {
  return SWISS_CANTONS.map((canton) => ({ code: canton.code.toLowerCase() }));
}

async function safeGetFarms(): Promise<Farm[]> {
  try {
    return await getFarms();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  if (!isValidCantonCode(code)) {
    return { title: "Canton not found" };
  }
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  const name = getCantonName(code);
  const region = translate(locale, getRegionKeyForCanton(code));
  const title = translate(locale, "canton_title", { canton: name });
  const description = translate(locale, "canton_meta", {
    canton: name,
    region,
  });
  const canonical = `/canton/${code.toLowerCase()}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: "website", url: canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CantonPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!isValidCantonCode(code)) {
    notFound();
  }

  const upper = code.toUpperCase();
  const name = getCantonName(upper);
  const regionKey = getRegionKeyForCanton(upper);
  const allFarms = await safeGetFarms();

  const farms = allFarms
    .filter((farm) => farm.canton.toUpperCase() === upper)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Cap the rendered cards: each is a backdrop-filter glass pane, and a big
  // canton has 1000+ farms — mounting them all exhausts iOS GPU memory (the
  // same failure the quick-search list hit). 48 crawlable links is plenty for
  // SEO; the "see all" CTA opens the full filtered list, and every farm URL is
  // already in the sitemap for direct indexing.
  const CARD_LIMIT = 48;
  const shownFarms = farms.slice(0, CARD_LIMIT);

  const topCategories = getTopFarmCategories(farms, 6);

  // Sibling cantons in the same region that actually have farms, with counts.
  const siblings: CantonSibling[] = getCantonsInRegion(regionKey)
    .filter((c) => c !== upper)
    .map((c) => ({
      code: c.toLowerCase(),
      name: getCantonName(c),
      count: allFarms.filter((farm) => farm.canton.toUpperCase() === c).length,
    }))
    .filter((sibling) => sibling.count > 0);

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Farms in ${name}`,
    url: `${siteUrl}/canton/${code.toLowerCase()}`,
    isPartOf: { "@type": "WebSite", url: siteUrl },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cantons",
          item: `${siteUrl}/canton`,
        },
        { "@type": "ListItem", position: 3, name },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: farms.length,
      itemListElement: farms.slice(0, 50).map((farm, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/farm/${encodeURIComponent(farm.id)}`,
        name: farm.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CantonView
        code={code.toLowerCase()}
        farms={shownFarms}
        name={name}
        regionKey={regionKey}
        siblings={siblings}
        topCategories={topCategories}
        totalCount={farms.length}
      />
    </>
  );
}
