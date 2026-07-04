"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { getCantonName } from "@/lib/farms";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Farm } from "@/types/farm";

// How many top cantons to feature on the home page (the rest live on the hub).
const FEATURED = 12;

/**
 * A "browse by canton" discovery section on the home page — surfaces the
 * canton landing pages (otherwise only linked from the footer), giving both
 * visitors a geographic entry point and search engines strong home→canton
 * internal links. Shows the busiest cantons; "All cantons" opens the full hub.
 */
export default function BrowseByCanton({ farms }: { farms: Farm[] }) {
  const t = useT();

  const counts = new Map<string, number>();
  for (const farm of farms) {
    const code = farm.canton.toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, FEATURED);

  if (top.length === 0) return null;

  return (
    <section className="mt-24 scroll-mt-28">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-black tracking-[-0.04em] text-ink">
              {t("home_browseByCanton")}
            </h2>
            <p className="mt-2 text-base leading-7 text-ink/60">
              {t("canton_hub_subtitle")}
            </p>
          </div>
          <Link
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-pine transition hover:text-ink"
            href="/canton"
          >
            {t("canton_allCantons")}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {top.map(([code, count], index) => (
          <Reveal delay={Math.min(index, 8) * 40} key={code}>
            <Link
              className="glass glass-interactive group flex items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
              href={`/canton/${code.toLowerCase()}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine/10 text-pine">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="truncate font-bold tracking-[-0.02em] text-ink">
                  {getCantonName(code)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-ink/50">
                {count}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
