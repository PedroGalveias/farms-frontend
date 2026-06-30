import type { Metadata } from "next";
import { headers } from "next/headers";
import ProfileView from "@/components/profile/ProfileView";
import { localeFromAcceptLanguage, translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );
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
