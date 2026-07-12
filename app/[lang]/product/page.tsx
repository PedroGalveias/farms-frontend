import type { Metadata } from "next";
import ProductHub, { type ProductEntry } from "@/components/product/ProductHub";
import { getFarms } from "@/lib/farms-service";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
} from "@/lib/i18n";
import { getFarmGroups } from "@/lib/farms";
import { categoryForSlug, getProductSlugs } from "@/lib/product-pages";
import type { Farm } from "@/types/farm";

export const revalidate = 3600;

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

export default async function ProductHubPage() {
  const farms = await safeGetFarms();

  const counts = new Map<string, number>();
  for (const farm of farms) {
    for (const group of getFarmGroups(farm)) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }

  const entries: ProductEntry[] = getProductSlugs().map((slug) => {
    const category = categoryForSlug(slug)!;
    return { slug, category, count: counts.get(category) ?? 0 };
  });

  return <ProductHub entries={entries} />;
}
