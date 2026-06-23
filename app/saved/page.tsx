import type { Metadata } from "next";
import { headers } from "next/headers";
import SavedView from "@/components/saved/SavedView";
import { getFarms } from "@/lib/farms-service";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";
import type { Farm } from "@/types/farm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
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
