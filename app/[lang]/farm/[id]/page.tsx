import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FarmDetail from "@/components/FarmDetail";
import { getFarmById } from "@/lib/farms-service";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeAlternates,
  type Locale,
} from "@/lib/i18n";
import { farmJsonLd, farmMetaDescription, serializeJsonLd } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import type { Farm } from "@/types/farm";

// One request for one farm. This used to fetch the whole directory and
// `.find()` through it — ~3,155 farms over 32 paginated requests to render a
// single record — on the strength of a comment claiming no single-farm
// endpoint existed. `GET /farms/{id}` has been there since the taxonomy work.
//
// `getFarmById` already turns a real upstream 404 into null. Other failures
// must keep propagating to the route error boundary; presenting an outage as a
// missing farm produces a false, cacheable 404 for a perfectly valid URL.
async function findFarm(id: string, locale: Locale): Promise<Farm | null> {
  return getFarmById(id, locale);
}

/**
 * No farm is prerendered — there are ~3,155 of them and the build would have to
 * walk the whole directory. This exists purely so Cache Components can validate
 * the route's shell at build time; returning an empty list says "no known ids",
 * and every farm is then served as an App Shell and filled in at request time.
 */
export function generateStaticParams() {
  // One sample, not a real farm. Cache Components requires at least one value
  // so it can validate at build time that the route's shell has no unguarded
  // dynamic access; it refuses an empty list outright. This id resolves to
  // nothing, so the sample render exercises the notFound() path, and every
  // real farm is served as an App Shell filled in at request time.
  return [{ id: "00000000-0000-4000-8000-000000000000" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const farm = await findFarm(id, locale);

  if (!farm) {
    return { title: "Farm not found" };
  }

  // Localize the description from the URL's locale segment.
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
  const { id, lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const farm = await findFarm(id, locale);

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
