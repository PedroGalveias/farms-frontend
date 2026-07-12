import type { Metadata } from "next";
import { headers } from "next/headers";
import SettingsView from "@/components/settings/SettingsView";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
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
