import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import FarmDetail from "@/components/FarmDetail";
import { getFarms } from "@/lib/farms-service";
import { localeFromAcceptLanguage } from "@/lib/i18n";
import { farmJsonLd, farmMetaDescription } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

export const dynamic = "force-dynamic";

// There's no single-farm endpoint, so we fetch the list and find the farm.
// Returns null on any failure so the page can render a clean 404.
async function findFarm(id: string): Promise<Farm | null> {
  try {
    const farms = await getFarms();
    return farms.find((farm) => farm.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const farm = await findFarm(id);

  if (!farm) {
    return { title: "Farm not found" };
  }

  // Localize the description from the request's Accept-Language (the client
  // locale isn't available during server render).
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  const description = farmMetaDescription(farm, locale);
  return {
    title: farm.name,
    description,
    alternates: { canonical: `/farm/${encodeURIComponent(farm.id)}` },
    openGraph: {
      title: farm.name,
      description,
      type: "website",
      url: `/farm/${encodeURIComponent(farm.id)}`,
    },
    twitter: { card: "summary", title: farm.name, description },
  };
}

export default async function FarmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; products?: string }>;
}) {
  const { id } = await params;
  const farm = await findFarm(id);

  if (!farm) {
    notFound();
  }

  // When the visitor came from quick search, send them back there with their
  // product selection restored; otherwise back to the directory.
  const { from, products } = await searchParams;
  const fromQuickSearch = from === "quick-search";
  const backHref = fromQuickSearch
    ? `/quick-search${products ? `?products=${encodeURIComponent(products)}` : ""}`
    : "/";

  const jsonLd = farmJsonLd(farm, getSiteUrl());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmDetail
        backHref={backHref}
        farm={farm}
        fromQuickSearch={fromQuickSearch}
      />
    </>
  );
}
