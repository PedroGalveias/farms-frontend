"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageMenu from "@/components/LanguageMenu";
import ThemeToggle from "@/components/ThemeToggle";

const utilityClassName =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink/55 transition-colors hover:bg-tone hover:text-ink";

/**
 * Mobile top bar — a slim floating pill with the brand and utilities (theme,
 * language). Primary navigation lives in the bottom `MobileTabBar`. Shown only
 * below `lg`, where the persistent SideRail takes over.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4 lg:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-line/80 bg-cloud/70 pl-5 pr-3 shadow-[0_1px_2px_rgba(20,22,27,0.04),0_18px_40px_-24px_rgba(20,22,27,0.25)] backdrop-blur-xl">
        <Link
          className="group flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em] text-ink transition-opacity hover:opacity-80"
          href="/"
        >
          <Logo
            className="h-7 w-7 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6"
            idPrefix="hdr"
          />
          farms
          <span className="text-pine-bright">.</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageMenu
            placement="header"
            triggerClassName={utilityClassName}
          />
        </div>
      </div>
    </header>
  );
}
