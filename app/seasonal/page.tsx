import type { Metadata } from "next";
import { headers } from "next/headers";
import SeasonalCalendar from "@/components/SeasonalCalendar";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  return {
    title: translate(locale, "seasonal_title"),
    description: translate(locale, "seasonal_subtitle"),
  };
}

export default function SeasonalPage() {
  return <SeasonalCalendar />;
}
