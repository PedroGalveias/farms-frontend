import type { Metadata } from "next";
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
import { SWISS_REGIONS, getCantonName, getCantonsInRegion } from "@/lib/farms";
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

export default async function CantonHubPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const farms = await safeGetFarms();
  const counts = countByCanton(farms);

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
      current={translate(locale, "canton_breadcrumb")}
      groups={groups}
      subtitle={translate(locale, "canton_hub_subtitle")}
      title={translate(locale, "canton_hub_title")}
      trail={[{ href: "/", label: translate(locale, "breadcrumb_home") }]}
    />
  );
}
