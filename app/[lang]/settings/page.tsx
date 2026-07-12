import type { Metadata } from "next";
import SettingsView from "@/components/settings/SettingsView";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return {
    title: translate(locale, "settings_title"),
    description: translate(locale, "settings_subtitle"),
    // Per-device preferences — keep it out of indexes.
    robots: { index: false, follow: false },
  };
}

export default function SettingsPage() {
  return <SettingsView />;
}
