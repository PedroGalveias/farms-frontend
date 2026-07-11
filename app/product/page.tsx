import type { Metadata } from "next";
import { headers } from "next/headers";
import ProductHub, { type ProductEntry } from "@/components/product/ProductHub";
import { getFarms } from "@/lib/farms-service";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  const title = translate(locale, "product_hub_title");
  const description = translate(locale, "product_hub_subtitle");
  return {
    title,
    description,
    alternates: { canonical: "/product" },
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
