"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

export interface CantonEntry {
  code: string;
  name: string;
  count: number;
}

export interface CantonGroup {
  key: string;
  cantons: CantonEntry[];
}

interface CantonDirectoryProps {
  title: string;
  subtitle: string;
  /** Breadcrumb trail before the current page. */
  trail: { href: string; label: string }[];
  current: string;
  groups: CantonGroup[];
  /** Whether to show each group's region name as a section heading. */
  showRegionHeadings?: boolean;
}

/**
 * Region-grouped grid of canton links with farm counts — the shared body of the
 * "browse by canton" hub and each region page. Every canton is a crawlable
 * link, so these pages form a clean internal-link web (home → hub/region →
 * canton → farm) for both visitors and search engines.
 */
export default function CantonDirectory({
  title,
  subtitle,
  trail,
  current,
  groups,
  showRegionHeadings = true,
}: CantonDirectoryProps) {
  const t = useT();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
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

      <header className="mt-6 max-w-2xl">
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-lg leading-7 text-ink/60">{subtitle}</p>
      </header>

      <div className="mt-10 space-y-10">
        {groups.map((group) => (
          <section key={group.key}>
            {showRegionHeadings ? (
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
                {t(group.key)}
              </h2>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.cantons.map((canton) => (
                <Link
                  className="glass glass-interactive group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
                  href={`/canton/${canton.code}`}
                  key={canton.code}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine/10 text-pine">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="font-bold tracking-[-0.02em] text-ink">
                      {canton.name}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink/50">
                    {canton.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
