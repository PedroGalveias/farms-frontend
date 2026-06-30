"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, Search } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";

function tabClassName(isActive: boolean) {
  return `flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
    isActive
      ? "bg-ink text-cloud shadow-[0_6px_16px_-6px_rgba(20,22,27,0.5)]"
      : "text-ink/60 hover:text-ink"
  }`;
}

/**
 * Native-style bottom tab bar for primary navigation on mobile. A floating
 * blurred pill (matching the rest of the chrome), hidden on `lg` where the
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
          : "";

  return (
    <nav
      aria-label="Primary"
      className="mobile-tab-bar fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[min(92%,360px)] items-center gap-1.5 rounded-full border border-line/80 bg-cloud/80 p-1.5 shadow-[0_10px_34px_-10px_rgba(20,22,27,0.4)] backdrop-blur-xl lg:hidden"
    >
      <Link
        aria-current={active === "directory" ? "page" : undefined}
        className={tabClassName(active === "directory")}
        href="/"
        onClick={() => haptic()}
      >
        <LayoutGrid className="h-4 w-4" />
        {t("nav_directory")}
      </Link>
      <Link
        aria-current={active === "quick-search" ? "page" : undefined}
        className={tabClassName(active === "quick-search")}
        href="/quick-search"
        onClick={() => haptic()}
      >
        <Search className="h-4 w-4" />
        {t("nav_quickSearch")}
      </Link>
      <Link
        aria-current={active === "saved" ? "page" : undefined}
        aria-label={t("saved_title")}
        className={`relative flex shrink-0 items-center justify-center rounded-full px-4 py-3 transition-colors duration-300 ${
          active === "saved"
            ? "bg-ink text-cloud shadow-[0_6px_16px_-6px_rgba(20,22,27,0.5)]"
            : "text-ink/60 hover:text-ink"
        }`}
        href="/saved"
        onClick={() => haptic()}
      >
        <Heart className="h-4 w-4" />
        {favoritesCount > 0 ? (
          <span className="absolute -right-0 -top-0 grid h-4 min-w-4 place-items-center rounded-full bg-pine px-1 text-[10px] font-bold text-white">
            {favoritesCount}
          </span>
        ) : null}
      </Link>
    </nav>
  );
}
