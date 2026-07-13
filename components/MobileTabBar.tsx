"use client";

import Link from "@/components/i18n/LocalizedLink";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Heart, LayoutGrid, Search } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";

function tabTextClassName(isActive: boolean) {
  return `relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
    isActive ? "text-cloud" : "text-ink/60 hover:text-ink"
  }`;
}

/**
 * Native-style bottom tab bar for primary navigation on mobile. A floating
 * blurred pill (matching the rest of the chrome) with a single dark "active
 * pill" that slides between tabs as you navigate. Hidden on `lg` where the
 * SideRail takes over.
 */
export default function MobileTabBar() {
  const pathname = usePathname();
  const t = useT();
  const { favoritesCount } = usePersonalization();
  const active =
    pathname === "/quick-search"
      ? "quick-search"
      : pathname === "/saved"
        ? "saved"
        : pathname === "/"
          ? "directory"
          : undefined;

  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const directoryRef = useRef<HTMLAnchorElement>(null);
  const searchRef = useRef<HTMLAnchorElement>(null);
  const savedRef = useRef<HTMLAnchorElement>(null);
  const activeRef =
    active === "directory"
      ? directoryRef
      : active === "quick-search"
        ? searchRef
        : active === "saved"
          ? savedRef
          : null;

  useSlidingIndicator(navRef, activeRef, indicatorRef, active);

  return (
    <nav
      aria-label="Primary"
      className="glass glass-chrome mobile-tab-bar fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[min(92%,360px)] items-center gap-1.5 rounded-full p-1.5 [view-transition-name:tab-bar] lg:hidden"
      ref={navRef}
    >
      {/* The sliding active pill, positioned by useSlidingIndicator. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0 rounded-full bg-ink opacity-0 shadow-[0_6px_16px_-6px_rgba(20,22,27,0.5)] transition-[transform,width,height,opacity] duration-[450ms] ease-[cubic-bezier(0.34,1.3,0.5,1)]"
        ref={indicatorRef}
      />
      <Link
        aria-current={active === "directory" ? "page" : undefined}
        className={tabTextClassName(active === "directory")}
        href="/"
        onClick={() => haptic()}
        ref={directoryRef}
      >
        <LayoutGrid className="h-4 w-4" />
        {t("nav_directory")}
      </Link>
      <Link
        aria-current={active === "quick-search" ? "page" : undefined}
        className={tabTextClassName(active === "quick-search")}
        href="/quick-search"
        onClick={() => haptic()}
        ref={searchRef}
      >
        <Search className="h-4 w-4" />
        {t("nav_quickSearch")}
      </Link>
      <Link
        aria-current={active === "saved" ? "page" : undefined}
        aria-label={t("saved_title")}
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-full px-4 py-3 transition-colors duration-300 ${
          active === "saved" ? "text-cloud" : "text-ink/60 hover:text-ink"
        }`}
        href="/saved"
        onClick={() => haptic()}
        ref={savedRef}
      >
        <Heart className="h-4 w-4" />
        {favoritesCount > 0 ? (
          <span className="absolute -right-0 -top-0 grid h-4 min-w-4 place-items-center rounded-full bg-pine-surface px-1 text-[10px] font-bold text-white">
            {favoritesCount}
          </span>
        ) : null}
      </Link>
    </nav>
  );
}
