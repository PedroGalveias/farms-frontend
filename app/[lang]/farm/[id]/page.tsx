import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FarmDetail from "@/components/FarmDetail";
import { getFarmById } from "@/lib/farms-service";
import { DEFAULT_LOCALE, isLocale, localeAlternates } from "@/lib/i18n";
import { farmJsonLd, farmMetaDescription, serializeJsonLd } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

// One request for one farm. This used to fetch the whole directory and
// `.find()` through it — ~3,155 farms over 32 paginated requests to render a
// single record — on the strength of a comment claiming no single-farm
// endpoint existed. `GET /farms/{id}` has been there since the taxonomy work.
//
// Returns null on any failure so the page can render a clean 404: a missing
// farm and an unreachable service look the same to a visitor following a
// stale link, and neither should be a stack trace.
async function findFarm(id: string): Promise<Farm | null> {
  try {
    return await getFarmById(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const farm = await findFarm(id);

  if (!farm) {
    return { title: "Farm not found" };
  }

  // Localize the description from the URL's locale segment.
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const description = farmMetaDescription(farm, locale);
  return {
    title: farm.name,
    description,
    alternates: localeAlternates(`/farm/${encodeURIComponent(farm.id)}`),
    openGraph: {
      title: farm.name,
      description,
      type: "website",
      url: `/farm/${encodeURIComponent(farm.id)}`,
    },
    // The generated opengraph-image.tsx supplies the large preview image.
    twitter: { card: "summary_large_image", title: farm.name, description },
  };
}

export default async function FarmPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <FarmDetail
        backHref={backHref}
        farm={farm}
        fromQuickSearch={fromQuickSearch}
      />
    </>
  );
}
