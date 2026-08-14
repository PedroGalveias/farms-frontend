import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView, {
  type ProductSibling,
} from "@/components/product/ProductView";
import RouteDataSkeleton from "@/components/RouteDataSkeleton";
import { getFarmFacets, getFarms, type FarmsQuery } from "@/lib/farms-service";
import { facetsFromApi } from "@/lib/directory-facets";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
  type Locale,
} from "@/lib/i18n";
import { categoryLabel, categorySlug } from "@/lib/categories";
import { getFarmGroups } from "@/lib/farms";
import { matchesCategories } from "@/lib/directory";
import {
  categoryForSlug,
  getProductSlugs,
  getTopCantonsForCategory,
} from "@/lib/product-pages";
import { serializeJsonLd } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

// Pre-render every product page at build time; the catalog changes rarely.

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
}

async function safeGetFarms(
  locale: Locale,
  query: FarmsQuery = {},
): Promise<Farm[]> {
  try {
    return await getFarms(locale, query);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const category = categoryForSlug(slug);
  if (!category) {
    return { title: "Product not found" };
  }
  const label = categoryLabel(category, locale);
  const title = translate(locale, "product_title", { product: label });
  const description = translate(locale, "product_meta", { product: label });
  const canonical = `/product/${slug.toLowerCase()}`;
  return {
    title,
    description,
    alternates: localeAlternates(canonical),
    openGraph: { title, description, type: "website", url: canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  return (
    <Suspense fallback={<RouteDataSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const category = categoryForSlug(slug);
  if (!category) {
    notFound();
  }

  const apiFacets = await getFarmFacets(locale);
  const apiSlug = categorySlug(category);
  const query = apiSlug ? { categories: [apiSlug] } : {};
  const [categoryFarms, fallbackFarms] = await Promise.all([
    safeGetFarms(locale, query),
    apiFacets ? Promise.resolve([]) : safeGetFarms(locale),
  ]);
  const farms = categoryFarms
    .filter((farm) => matchesCategories(farm, [category], "any"))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Same cap as the canton pages: each card is a glass pane, and mounting
  // hundreds exhausts iOS GPU memory. 48 crawlable links is plenty; the
  // "see all" CTA opens the pre-filtered directory.
  const CARD_LIMIT = 48;
  const shownFarms = farms.slice(0, CARD_LIMIT);

  const topCantons = getTopCantonsForCategory(farms, category);

  // The other products, with counts — skipping empty ones.
  const counts = new Map<string, number>();
  if (apiFacets) {
    for (const [group, count] of Object.entries(
      facetsFromApi(apiFacets).categoryCounts,
    )) {
      counts.set(group, count);
    }
  } else {
    for (const farm of fallbackFarms) {
      for (const group of getFarmGroups(farm)) {
        counts.set(group, (counts.get(group) ?? 0) + 1);
      }
    }
  }
  const siblings: ProductSibling[] = getProductSlugs()
    .map((otherSlug) => {
      const otherCategory = categoryForSlug(otherSlug)!;
      return {
        slug: otherSlug,
        category: otherCategory,
        count: counts.get(otherCategory) ?? 0,
      };
    })
    .filter((sibling) => sibling.category !== category && sibling.count > 0);

  const siteUrl = getSiteUrl();
  const label = categoryLabel(category, locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: translate(locale, "product_title", { product: label }),
    url: `${siteUrl}/product/${slug.toLowerCase()}`,
    isPartOf: { "@type": "WebSite", url: siteUrl },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "Products",
          item: `${siteUrl}/product`,
        },
        { "@type": "ListItem", position: 3, name: label },
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ProductView
        locale={locale}
        category={category}
        farms={shownFarms}
        siblings={siblings}
        topCantons={topCantons}
        totalCount={farms.length}
      />
    </>
  );
}
