"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin, Search } from "lucide-react";
import FarmLinkCard from "@/components/directory/FarmLinkCard";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { getCantonName } from "@/lib/farms";
import type { Farm } from "@/types/farm";

export interface ProductSibling {
  slug: string;
  category: string;
  count: number;
}

interface ProductViewProps {
  /** Canonical category key (German, catalog key). */
  category: string;
  /** The farms to render as cards (already capped by the page). */
  farms: Farm[];
  /** Total farms offering the product (may exceed the rendered `farms`). */
  totalCount: number;
  /** [canton code, count] pairs where the product is most available. */
  topCantons: [string, number][];
  siblings: ProductSibling[];
}

/**
 * Product landing page body — the category twin of CantonView. Localized
 * heading and summary, CTAs into the pre-filtered directory and quick search,
 * canton cross-links (the other axis of the internal-link web), a capped grid
 * of crawlable farm cards, and sibling products.
 */
export default function ProductView({
  category,
  farms,
  totalCount,
  topCantons,
  siblings,
}: ProductViewProps) {
  const t = useT();
  const { locale } = useLanguage();
  const label = categoryLabel(category, locale);
  const directoryHref = `/?cat=${encodeURIComponent(category)}`;

  const summaryKey =
    totalCount === 0
      ? "product_summary_zero"
      : totalCount === 1
        ? "product_summary_one"
        : "product_summary";

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Breadcrumb
        trail={[
          { href: "/", label: t("breadcrumb_home") },
          { href: "/product", label: t("product_breadcrumb") },
        ]}
        current={label}
      />

      <header className="mt-6">
        <span aria-hidden className="text-4xl">
          {categoryEmoji(category)}
        </span>
        <h1 className="mt-3 text-[clamp(2.25rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {t("product_title", { product: label })}
        </h1>
        <p className="mt-3 text-lg leading-7 text-ink/60">
          {t(summaryKey, { n: totalCount, product: label })}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            href={directoryHref}
          >
            <MapPin className="h-4 w-4" />
            {t("product_openDirectory")}
          </Link>
          <Link
            className="glass glass-interactive inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            href="/quick-search"
          >
            <Search className="h-4 w-4" />
            {t("cta_startQuickSearch")}
          </Link>
        </div>

        {topCantons.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/50">
              {t("product_topCantons")}
            </span>
            {topCantons.map(([code, count]) => (
              <Link
                className="glass-chip rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:text-ink"
                href={`/canton/${code.toLowerCase()}`}
                key={code}
              >
                {getCantonName(code)}
                <span className="ml-1.5 text-ink/45">{count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {farms.length > 0 ? (
        <>
          <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {farms.map((farm) => (
              <FarmLinkCard farm={farm} key={farm.id} />
            ))}
          </section>
          {totalCount > farms.length ? (
            <div className="mt-8 flex justify-center">
              <Link
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
                href={directoryHref}
              >
                {t("product_seeAll", { n: totalCount })}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <section className="glass mt-10 rounded-[28px] p-10 text-center">
          <p className="text-base leading-7 text-ink/60">
            {t("product_summary_zero", { product: label })}
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98]"
            href="/"
          >
            {t("product_empty_cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {siblings.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
            {t("product_otherProducts")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {siblings.map((sibling) => (
              <Link
                className="glass glass-interactive inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink/75 transition hover:text-ink"
                href={`/product/${sibling.slug}`}
                key={sibling.slug}
              >
                <span aria-hidden>{categoryEmoji(sibling.category)}</span>
                {categoryLabel(sibling.category, locale)}
                <span className="text-ink/45">{sibling.count}</span>
              </Link>
            ))}
          </div>
          <Link
            className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-bold text-pine transition hover:text-ink"
            href="/product"
          >
            {t("product_allProducts")}
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </section>
      ) : null}
    </main>
  );
}

function Breadcrumb({
  trail,
  current,
}: {
  trail: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink/50"
    >
      {trail.map((crumb) => (
        <span className="flex items-center gap-1.5" key={crumb.href}>
          <Link className="transition hover:text-ink" href={crumb.href}>
            {crumb.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink/30" />
        </span>
      ))}
      <span className="text-ink/80">{current}</span>
    </nav>
  );
}
