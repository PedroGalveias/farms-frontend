import { Suspense } from "react";
import type { Metadata } from "next";
import CantonDirectory, {
  type CantonGroup,
} from "@/components/canton/CantonDirectory";
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
import { SWISS_REGIONS, getCantonName, getCantonsInRegion } from "@/lib/farms";
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
  const title = translate(locale, "canton_hub_title");
  const description = translate(locale, "canton_hub_subtitle");
  return {
    title,
    description,
    alternates: localeAlternates("/canton"),
    openGraph: { title, description, type: "website", url: "/canton" },
  };
}

function countByCanton(farms: Farm[]) {
  const counts = new Map<string, number>();
  for (const farm of farms) {
    const code = farm.canton.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return counts;
}

export default function CantonHubPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return (
    <Suspense fallback={<RouteDataSkeleton />}>
      <CantonHubContent params={params} />
    </Suspense>
  );
}

async function CantonHubContent({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const apiFacets = await getFarmFacets(locale);
  const counts = apiFacets
    ? new Map(Object.entries(facetsFromApi(apiFacets).cantonCounts))
    : countByCanton(await safeGetFarms(locale));

  // Every region → its cantons that have at least one farm, with counts.
  const groups: CantonGroup[] = SWISS_REGIONS.map((region) => ({
    key: region.key,
    cantons: getCantonsInRegion(region.key)
      .map((code) => ({
        code: code.toLowerCase(),
        name: getCantonName(code),
        count: counts.get(code) ?? 0,
      }))
      .filter((canton) => canton.count > 0),
  })).filter((group) => group.cantons.length > 0);

  return (
    <CantonDirectory
      locale={locale}
      current={translate(locale, "canton_breadcrumb")}
      groups={groups}
      subtitle={translate(locale, "canton_hub_subtitle")}
      title={translate(locale, "canton_hub_title")}
      trail={[{ href: "/", label: translate(locale, "breadcrumb_home") }]}
    />
  );
}
