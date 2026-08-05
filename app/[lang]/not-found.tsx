import { lang as rootLang } from "next/root-params";
import GoBackButton from "@/components/GoBackButton";
import SiteFooter from "@/components/SiteFooter";
import { MESSAGES, isLocale, type Locale } from "@/lib/i18n";

export default async function NotFoundPage() {
  // Same resolution as the layout: this boundary renders inside it, so the
  // root param is available and is the locale the visitor is actually on.
  const lang = await rootLang();
  const locale: Locale = isLocale(lang ?? "") ? (lang as Locale) : "en";

  return (
    <div className="relative overflow-clip">
      <main className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
        <p className="rise-in text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Error 404
        </p>
        <h1
          className="rise-in mt-5 max-w-3xl text-display font-extrabold leading-[0.9] tracking-[-0.045em] text-ink"
          style={{ ["--rise-delay" as string]: "80ms" }}
        >
          This page wandered <span className="text-pine">off the map.</span>
        </h1>
        <p
          className="rise-in mt-6 max-w-xl text-lg leading-8 text-ink/60"
          style={{ ["--rise-delay" as string]: "180ms" }}
        >
          The page you&apos;re looking for isn&apos;t here. Head back to where
          you were, or use the bar below to browse the directory or quick
          search.
        </p>

        <div
          className="rise-in mt-9"
          style={{ ["--rise-delay" as string]: "260ms" }}
        >
          <GoBackButton label={MESSAGES[locale].not_found_back} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
