import type { Metadata } from "next";
import SavedView from "@/components/saved/SavedView";
import { getFarms } from "@/lib/farms-service";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";
import type { Farm } from "@/types/farm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return {
    title: translate(locale, "saved_title"),
    description: translate(locale, "saved_subtitle"),
  };
}

export default async function SavedPage() {
  // Saved farms are stored as ids in the browser; we need the farm list to
  // resolve them. Fall back to an empty list so the page still renders its
  // (localStorage-driven) empty state if the backend is down.
  let farms: Farm[] = [];
  try {
    farms = await getFarms();
  } catch {
    farms = [];
  }

  return <SavedView farms={farms} />;
}
