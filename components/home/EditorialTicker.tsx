"use client";

import Reveal from "@/components/motion/Reveal";
import { useT } from "@/components/i18n/LanguageProvider";

const TICKER_KEYS = [
  "ticker_1",
  "ticker_2",
  "ticker_3",
  "ticker_4",
  "ticker_5",
];

/** Looping marquee of editorial taglines below the bento overview. */
export default function EditorialTicker() {
  const t = useT();

  return (
    <Reveal
      className="marquee mt-12 overflow-hidden border-y border-line py-3.5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      once
    >
      <div className="marquee-track flex w-max items-center gap-6 text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
        {[...TICKER_KEYS, ...TICKER_KEYS, ...TICKER_KEYS].map((key, index) => (
          <span className="flex items-center gap-6" key={index}>
            {t(key)}
            <span aria-hidden className="text-pine">
              •
            </span>
          </span>
        ))}
      </div>
    </Reveal>
  );
}
