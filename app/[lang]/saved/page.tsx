import type { Metadata } from "next";
import SavedView from "@/components/saved/SavedView";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";

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

/**
 * Ships no farms at all.
 *
 * Which farms belong here is a fact about *this browser* — favourites and
 * collections are localStorage ids the server cannot know. The page used to
 * resolve them by sending the entire directory and letting the client pick a
 * handful out of it: 949 KB of HTML against 311 KB for the next largest route,
 * even after #187 projected each farm down to what a card renders.
 *
 * So it sends nothing. `SavedView` reads its ids, asks
 * `/api/farms?ids=…` for exactly those, and keeps its own offline copy. That
 * makes this route static, and the payload proportional to what a visitor
 * actually saved rather than to the size of the directory.
 */
export default function SavedPage() {
  return <SavedView />;
}
