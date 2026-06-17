"use client";

import { ArrowUpRight, Github } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

const FARMS_SERVICE_REPO = "https://github.com/PedroGalveias/farms";
const FARMS_FRONTEND_REPO = "https://github.com/PedroGalveias/farms-frontend";

const footerLinkClassName =
  "group inline-flex items-center gap-1.5 font-semibold text-ink/70 transition-colors hover:text-ink";

function HoverArrow() {
  return (
    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
  );
}

export default function SiteFooter() {
  const t = useT();

  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line/70">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-8">
        <div className="text-[15px]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/35">
            {t("footer_source")}
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-8">
            <a
              className={footerLinkClassName}
              href={FARMS_SERVICE_REPO}
              rel="noreferrer"
              target="_blank"
            >
              <Github className="h-4 w-4 text-ink/40 transition-colors group-hover:text-pine" />
              {t("footer_farmsService")}
              <HoverArrow />
            </a>
            <a
              className={footerLinkClassName}
              href={FARMS_FRONTEND_REPO}
              rel="noreferrer"
              target="_blank"
            >
              <Github className="h-4 w-4 text-ink/40 transition-colors group-hover:text-pine" />
              {t("footer_farmsFrontend")}
              <HoverArrow />
            </a>
          </div>
        </div>

        {/* Oversized wordmark — a quiet, confident signature. */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-14 select-none text-[19vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-ink/[0.05] sm:text-[15vw]"
        >
          farms.
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-line/70 pt-6 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} farms</p>
          <p>{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
