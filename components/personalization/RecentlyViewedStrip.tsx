"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { getCantonName } from "@/lib/farms";
import { farmPath } from "@/lib/share";
import type { Farm } from "@/types/farm";

/**
 * Horizontal strip of the farms the visitor recently opened, resolved from the
 * recently-viewed id history against the loaded farm list. Renders nothing until
 * there's at least one resolvable farm.
 */
export default function RecentlyViewedStrip({ farms }: { farms: Farm[] }) {
  const t = useT();
  const { recent } = usePersonalization();

  const byId = new Map(farms.map((farm) => [farm.id, farm]));
  const recentFarms = recent
    .map((id) => byId.get(id))
    .filter((farm): farm is Farm => farm != null);

  if (recentFarms.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
        <Clock className="h-3.5 w-3.5" />
        {t("recent_title")}
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recentFarms.map((farm) => (
          <Link
            className="group w-56 shrink-0 rounded-2xl border border-line bg-cloud p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_18px_40px_-24px_rgba(20,22,27,0.4)] focus-visible:ring-2 focus-visible:ring-ink/20"
            href={farmPath(farm.id)}
            key={farm.id}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-pine">
              {farm.canton} · {getCantonName(farm.canton)}
            </p>
            <p className="mt-1.5 truncate text-base font-bold tracking-[-0.02em] text-ink">
              {farm.name}
            </p>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink/60">
              <MapPin className="h-3 w-3 shrink-0 text-ink/30" />
              {farm.address}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
