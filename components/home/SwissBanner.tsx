"use client";

import SwissFlagGlass from "@/components/hero/SwissFlagGlass";
import Reveal from "@/components/motion/Reveal";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * A closing "proudly Swiss" moment near the bottom of the home page: a glass
 * band framing an ambient, gently-rippling WebGL Swiss flag beside a short
 * line of copy.
 */
export default function SwissBanner() {
  const t = useT();
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <Reveal>
        <div className="glass glass-card relative overflow-hidden rounded-[32px] p-6 sm:p-10">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between sm:gap-12">
            <div className="max-w-md text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pine">
                {t("swiss_eyebrow")}
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
                {t("swiss_title")}
              </h2>
              <p className="mt-4 text-base leading-7 text-ink/60">
                {t("swiss_body")}
              </p>
            </div>

            {/* The squared, glass-framed ambient flag. */}
            <div className="glass-inset relative aspect-square w-44 shrink-0 overflow-hidden rounded-[28px] shadow-[0_24px_60px_-24px_rgba(20,22,27,0.5)] sm:w-56">
              <SwissFlagGlass className="h-full w-full" />
              {/* Glass sheen over the flag. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/25 via-transparent to-transparent"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
