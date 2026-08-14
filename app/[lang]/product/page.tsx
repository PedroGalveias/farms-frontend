import { Suspense } from "react";
import type { Metadata } from "next";
import ProductHub, { type ProductEntry } from "@/components/product/ProductHub";
import RouteDataSkeleton from "@/components/RouteDataSkeleton";
import { getFarmFacets, getFarms } from "@/lib/farms-service";
import { facetsFromApi } from "@/lib/directory-facets";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
  type Locale,
} from "@/lib/i18n";
import { getFarmGroups } from "@/lib/farms";
import { categoryForSlug, getProductSlugs } from "@/lib/product-pages";
import type { Farm } from "@/types/farm";

async function safeGetFarms(locale: Locale): Promise<Farm[]> {
  try {
    return await getFarms(locale);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const title = translate(locale, "product_hub_title");
  const description = translate(locale, "product_hub_subtitle");
  return {
    title,
    description,
    alternates: localeAlternates("/product"),
    openGraph: { title, description, type: "website", url: "/product" },
  };
}

export default function ProductHubPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return (
    <Suspense fallback={<RouteDataSkeleton />}>
      <ProductHubContent params={params} />
    </Suspense>
  );
}

async function ProductHubContent({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  const apiFacets = await getFarmFacets(locale);
  const counts = new Map<string, number>();
  if (apiFacets) {
    for (const [category, count] of Object.entries(
      facetsFromApi(apiFacets).categoryCounts,
    )) {
      counts.set(category, count);
    }
  } else {
    for (const farm of await safeGetFarms(locale)) {
      for (const group of getFarmGroups(farm)) {
        counts.set(group, (counts.get(group) ?? 0) + 1);
      }
    }
  }

  const entries: ProductEntry[] = getProductSlugs().map((slug) => {
    const category = categoryForSlug(slug)!;
    return { slug, category, count: counts.get(category) ?? 0 };
  });

  return <ProductHub entries={entries} locale={locale} />;
}
