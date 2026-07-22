"use client";

import Link from "@/components/i18n/LocalizedLink";
import { ArrowRight, MapPin, Route, ShoppingBasket } from "lucide-react";
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
              className="mt-5 max-w-md text-title font-black leading-[0.95] tracking-[-0.04em]"
              id="slab-cta-title"
            >
              {t("slab_title")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/65">
              {t("slab_subcopy")}
            </p>
            <div className="mt-8">
              <Link
                className="group inline-flex items-center gap-2 rounded-chip bg-white px-7 py-4 text-sm font-bold text-[#14161b] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
                href="/quick-search"
              >
                {t("cta_startQuickSearch")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* How it works — the three quick-search steps, right where the CTA
              sits. */}
          <div className="relative flex min-h-[260px] flex-col justify-center gap-7 bg-[#16713f] px-6 py-14 text-white sm:px-12 lg:min-h-[460px]">
            <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_70%_-10%,rgba(255,255,255,0.12),transparent_60%)]" />
            <ol className="relative space-y-7">
              {(
                [
                  { icon: MapPin, key: "1" },
                  { icon: ShoppingBasket, key: "2" },
                  { icon: Route, key: "3" },
                ] as const
              ).map(({ icon: Icon, key }, index) => (
                <li className="flex items-start gap-5" key={key}>
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-field bg-white/15 text-white">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-chip bg-white text-[11px] font-black text-[#14161b]">
                      {index + 1}
                    </span>
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-7">
                      {t(`slab_step${key}_title`)}
                    </p>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-white/65">
                      {t(`slab_step${key}_body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
