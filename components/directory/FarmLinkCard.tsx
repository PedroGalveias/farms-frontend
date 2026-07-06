"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { tagLabel } from "@/lib/products";
import { getCantonName } from "@/lib/farms";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import type { Farm } from "@/types/farm";

const MAX_CHIPS = 4;

/**
 * A farm summary rendered as a plain crawlable link to its page — used on the
 * canton/region landing pages where the whole card should be an <a> (good for
 * SEO and simpler than the interactive directory card). Glass-styled to match
 * the rest of the app.
 */
export default function FarmLinkCard({ farm }: { farm: Farm }) {
  const t = useT();
  const { locale } = useLanguage();
  const visible = farm.categories.slice(0, MAX_CHIPS);
  const hidden = farm.categories.length - visible.length;

  return (
    <Link
      aria-label={`${t("nearest_view")}: ${farm.name}`}
      className="glass glass-card card-cull glass-interactive group flex h-full flex-col rounded-[24px] p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_28px_56px_-26px_rgba(20,22,27,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
      href={`/farm/${encodeURIComponent(farm.id)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/60">
          {farm.canton} · {getCantonName(farm.canton)}
        </p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-ink/60" />
      </div>

      <h3 className="mt-2 text-lg font-bold leading-tight tracking-[-0.03em] text-ink">
        {farm.name}
      </h3>
      <p className="mt-1 flex items-start gap-1.5 text-sm leading-6 text-ink/60">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/30" />
        {farm.address}
      </p>

      {visible.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visible.map((category) => (
            <span
              className="glass-chip rounded-full px-2.5 py-1 text-xs font-semibold text-ink/70"
              key={category}
            >
              {tagLabel(category, locale)}
            </span>
          ))}
          {hidden > 0 ? (
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink/45">
              +{hidden}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
