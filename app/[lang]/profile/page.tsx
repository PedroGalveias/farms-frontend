import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";
import { DEFAULT_LOCALE, isLocale, translate } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return {
    title: translate(locale, "profile_title"),
    description: translate(locale, "profile_subtitle"),
    // The profile is per-user and gated client-side — keep it out of indexes.
    robots: { index: false, follow: false },
  };
}

export default function ProfilePage() {
  return <ProfileView />;
}
