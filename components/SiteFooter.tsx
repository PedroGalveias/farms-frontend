"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import GitHubIcon from "@/components/icons/GitHubIcon";
import { useT } from "@/components/i18n/LanguageProvider";
import { APP_VERSION } from "@/lib/version";

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
        <div className="grid gap-10 sm:grid-cols-2">
          <div className="text-[15px]">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
              {t("footer_source")}
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-8">
              <a
                className={footerLinkClassName}
                href={FARMS_SERVICE_REPO}
                rel="noreferrer"
                target="_blank"
              >
                <GitHubIcon className="h-4 w-4 text-ink/60 transition-colors group-hover:text-pine" />
                {t("footer_farmsService")}
                <HoverArrow />
              </a>
              <a
                className={footerLinkClassName}
                href={FARMS_FRONTEND_REPO}
                rel="noreferrer"
                target="_blank"
              >
                <GitHubIcon className="h-4 w-4 text-ink/60 transition-colors group-hover:text-pine" />
                {t("footer_farmsFrontend")}
                <HoverArrow />
              </a>
            </div>
          </div>

          <nav className="text-[15px]" aria-label={t("footer_browse")}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
              {t("footer_browse")}
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-8">
              <Link className={footerLinkClassName} href="/canton">
                {t("home_browseByCanton")}
                <HoverArrow />
              </Link>
              <Link className={footerLinkClassName} href="/seasonal">
                {t("seasonal_title")}
                <HoverArrow />
              </Link>
              <Link className={footerLinkClassName} href="/quick-search">
                {t("nav_quickSearch")}
                <HoverArrow />
              </Link>
            </div>
          </nav>
        </div>

        {/* Oversized wordmark — a quiet, confident signature. */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-14 select-none text-[19vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-ink/[0.05] sm:text-[15vw]"
        >
          farms.
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-line/70 pt-6 text-xs text-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} farms</span>
            <span
              className="inline-flex items-center rounded-full bg-pine-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
              title={t("beta_title")}
            >
              {t("beta_label")}
            </span>
            <span className="font-mono text-ink/45" title={t("beta_title")}>
              {APP_VERSION}
            </span>
          </p>
          <p className="flex items-center gap-2">
            {/* Small Swiss flag — official red, square, softly rounded. */}
            <svg
              aria-hidden
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="7" fill="#da291c" />
              <rect x="13" y="7" width="6" height="18" fill="#fff" />
              <rect x="7" y="13" width="18" height="6" fill="#fff" />
            </svg>
            {t("footer_tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
