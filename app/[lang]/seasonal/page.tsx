import type { Metadata } from "next";
import SeasonalCalendar from "@/components/SeasonalCalendar";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return {
    title: translate(locale, "seasonal_title"),
    description: translate(locale, "seasonal_subtitle"),
  };
}

export default function SeasonalPage() {
  return <SeasonalCalendar />;
}
