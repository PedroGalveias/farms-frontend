"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { useT } from "@/components/i18n/LanguageProvider";

/** Full-bleed green call-to-action slab above the footer. */
export default function GreenSlabCta() {
  const t = useT();

  return (
    <Reveal className="mt-24" once>
      <section
        aria-labelledby="slab-cta-title"
        className="relative w-full overflow-hidden bg-pine-surface text-white"
      >
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              {t("slab_eyebrow")}
            </p>
            <h2
              className="mt-5 max-w-md text-[clamp(2.25rem,4.5vw,3.5rem)] font-black leading-[0.95] tracking-[-0.04em]"
              id="slab-cta-title"
            >
              {t("slab_title")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/65">
              {t("slab_subcopy")}
            </p>
            <div className="mt-8">
              <Link
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#14161b] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
                href="/quick-search"
              >
                {t("cta_startQuickSearch")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div
            aria-hidden
            className="relative flex min-h-[260px] flex-col items-center justify-center gap-3 bg-[#16713f] text-white/70 lg:min-h-[460px]"
          >
            <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_70%_-10%,rgba(255,255,255,0.12),transparent_60%)]" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white">
              <ShoppingBasket className="h-6 w-6" />
            </span>
            <span className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
              {t("img_farmPhotography")}
            </span>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
