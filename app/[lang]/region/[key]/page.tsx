import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CantonDirectory, {
  type CantonGroup,
} from "@/components/canton/CantonDirectory";
import RouteDataSkeleton from "@/components/RouteDataSkeleton";
import { getFarmFacets, getFarms } from "@/lib/farms-service";
import { facetsFromApi } from "@/lib/directory-facets";
import { getCantonCounts } from "@/lib/directory";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
  type Locale,
} from "@/lib/i18n";
import { getCantonName, getCantonsInRegion, getRegionKeys } from "@/lib/farms";
import type { Farm } from "@/types/farm";

export function generateStaticParams() {
  return getRegionKeys().map((key) => ({ key }));
}

async function safeGetFarms(locale: Locale): Promise<Farm[]> {
  try {
    return await getFarms(locale);
  } catch {
    return [];
  }
}

function isValidRegion(key: string) {
  return getCantonsInRegion(key).length > 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; key: string }>;
}): Promise<Metadata> {
  const { lang, key } = await params;
  if (!isValidRegion(key)) {
    return { title: "Region not found" };
  }
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const region = translate(locale, key);
  const title = translate(locale, "region_page_title", { region });
  const description = translate(locale, "region_page_meta", {
    region,
    n: getCantonsInRegion(key).length,
    count: "",
  });
  const canonical = `/region/${key}`;
  return {
    title,
    description,
    alternates: localeAlternates(canonical),
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default function RegionPage({
  params,
}: {
  params: Promise<{ lang: string; key: string }>;
}) {
  return (
    <Suspense fallback={<RouteDataSkeleton />}>
      <RegionContent params={params} />
    </Suspense>
  );
}

async function RegionContent({
  params,
}: {
  params: Promise<{ lang: string; key: string }>;
}) {
  const { lang, key } = await params;
  if (!isValidRegion(key)) {
    notFound();
  }

  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const apiFacets = await getFarmFacets(locale);
  const cantonCounts = apiFacets
    ? facetsFromApi(apiFacets).cantonCounts
    : getCantonCounts(await safeGetFarms(locale));
  const region = translate(locale, key);

  const cantons = getCantonsInRegion(key)
    .map((code) => ({
      code: code.toLowerCase(),
      name: getCantonName(code),
      count: cantonCounts[code] ?? 0,
    }))
    .filter((canton) => canton.count > 0);

  const total = cantons.reduce((sum, canton) => sum + canton.count, 0);
  const groups: CantonGroup[] = [{ key, cantons }];

  return (
    <CantonDirectory
      locale={locale}
      current={region}
      groups={groups}
      showRegionHeadings={false}
      subtitle={translate(locale, "region_summary", { count: total, region })}
      title={translate(locale, "region_page_title", { region })}
      trail={[
        { href: "/", label: translate(locale, "breadcrumb_home") },
        { href: "/canton", label: translate(locale, "canton_breadcrumb") },
      ]}
    />
  );
}
