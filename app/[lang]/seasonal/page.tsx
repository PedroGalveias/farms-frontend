import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
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

/**
 * The calendar is its own Suspense fallback.
 *
 * Everything on this page is static except which month is highlighted. So the
 * fallback renders the complete calendar with `currentMonth={null}` — that
 * whole thing lands in the prerendered shell — and only the highlight arrives
 * at request time. A visitor sees the full year immediately either way.
 */
export default function SeasonalPage() {
  return (
    <Suspense fallback={<SeasonalCalendar currentMonth={null} />}>
      <CalendarForToday />
    </Suspense>
  );
}

async function CalendarForToday() {
  // The month is current-time data, which a prerender cannot capture.
  await connection();
  return <SeasonalCalendar currentMonth={new Date().getMonth()} />;
}
