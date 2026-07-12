import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CantonDirectory, {
  type CantonGroup,
} from "@/components/canton/CantonDirectory";
import { getFarms } from "@/lib/farms-service";
import {
  DEFAULT_LOCALE,
  isLocale,
  translate,
  localeAlternates,
} from "@/lib/i18n";
import { getCantonName, getCantonsInRegion, getRegionKeys } from "@/lib/farms";
import type { Farm } from "@/types/farm";

export const revalidate = 3600;

export function generateStaticParams() {
  return getRegionKeys().map((key) => ({ key }));
}

async function safeGetFarms(): Promise<Farm[]> {
  try {
    return await getFarms();
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

export default async function RegionPage({
  params,
}: {
  params: Promise<{ lang: string; key: string }>;
}) {
  const { lang, key } = await params;
  if (!isValidRegion(key)) {
    notFound();
  }

  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const farms = await safeGetFarms();
  const region = translate(locale, key);

  const cantons = getCantonsInRegion(key)
    .map((code) => ({
      code: code.toLowerCase(),
      name: getCantonName(code),
      count: farms.filter((farm) => farm.canton.toUpperCase() === code).length,
    }))
    .filter((canton) => canton.count > 0);

  const total = cantons.reduce((sum, canton) => sum + canton.count, 0);
  const groups: CantonGroup[] = [{ key, cantons }];

  return (
    <CantonDirectory
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
