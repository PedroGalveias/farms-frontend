import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView, {
  type ProductSibling,
} from "@/components/product/ProductView";
import { getFarms } from "@/lib/farms-service";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
} from "@/lib/i18n";
import { categoryLabel } from "@/lib/categories";
import { getFarmGroups } from "@/lib/farms";
import { matchesCategories } from "@/lib/directory";
import {
  categoryForSlug,
  getProductSlugs,
  getTopCantonsForCategory,
} from "@/lib/product-pages";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

// Pre-render every product page at build time; the catalog changes rarely.
export const revalidate = 3600;

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
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
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const category = categoryForSlug(slug);
  if (!category) {
    return { title: "Product not found" };
  }
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const category = categoryForSlug(slug);
  if (!category) {
    notFound();
  }

  const allFarms = await safeGetFarms();
  const farms = allFarms
    .filter((farm) => matchesCategories(farm, [category], "any"))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Same cap as the canton pages: each card is a glass pane, and mounting
  // hundreds exhausts iOS GPU memory. 48 crawlable links is plenty; the
  // "see all" CTA opens the pre-filtered directory.
  const CARD_LIMIT = 48;
  const shownFarms = farms.slice(0, CARD_LIMIT);

  const topCantons = getTopCantonsForCategory(allFarms, category);

  // The other products, with counts — skipping empty ones.
  const counts = new Map<string, number>();
  for (const farm of allFarms) {
    for (const group of getFarmGroups(farm)) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
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
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductView
        category={category}
        farms={shownFarms}
        siblings={siblings}
        topCantons={topCantons}
        totalCount={farms.length}
      />
    </>
  );
}
