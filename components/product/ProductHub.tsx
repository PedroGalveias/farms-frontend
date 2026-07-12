"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";

export interface ProductEntry {
  slug: string;
  category: string;
  count: number;
}

/**
 * "Browse by product" hub — the category twin of the canton hub: a grid of
 * crawlable product links with farm counts, the second axis of the
 * internal-link web (home → product → farm).
 */
export default function ProductHub({ entries }: { entries: ProductEntry[] }) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink/50"
      >
        <span className="flex items-center gap-1.5">
          <Link className="transition hover:text-ink" href="/">
            {t("breadcrumb_home")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink/30" />
        </span>
        <span className="text-ink/80">{t("product_breadcrumb")}</span>
      </nav>

      <header className="rise-in mt-6 max-w-2xl">
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {t("product_hub_title")}
        </h1>
        <p className="mt-3 text-lg leading-7 text-ink/60">
          {t("product_hub_subtitle")}
        </p>
      </header>

      <div
        className="rise-in mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        style={{ ["--rise-delay" as string]: "120ms" }}
      >
        {entries.map((entry) => (
          <Link
            className="glass glass-card glass-interactive group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
            href={`/product/${entry.slug}`}
            key={entry.slug}
          >
            <span className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">
                {categoryEmoji(entry.category)}
              </span>
              <span className="text-sm font-bold text-ink">
                {categoryLabel(entry.category, locale)}
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink/45">
              {entry.count}
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
