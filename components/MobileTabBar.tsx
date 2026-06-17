"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Search } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

function tabClassName(isActive: boolean) {
  return `flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
    isActive
      ? "bg-ink text-cloud shadow-[0_6px_16px_-6px_rgba(20,22,27,0.5)]"
      : "text-ink/55 hover:text-ink"
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
  const active =
    pathname === "/quick-search"
      ? "quick-search"
      : pathname === "/"
        ? "directory"
        : "";

  return (
    <nav
      aria-label="Primary"
      className="mobile-tab-bar fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(92%,360px)] items-center gap-1.5 rounded-full border border-line/80 bg-cloud/80 p-1.5 shadow-[0_10px_34px_-10px_rgba(20,22,27,0.4)] backdrop-blur-xl lg:hidden"
    >
      <Link
        aria-current={active === "directory" ? "page" : undefined}
        className={tabClassName(active === "directory")}
        href="/"
      >
        <LayoutGrid className="h-4 w-4" />
        {t("nav_directory")}
      </Link>
      <Link
        aria-current={active === "quick-search" ? "page" : undefined}
        className={tabClassName(active === "quick-search")}
        href="/quick-search"
      >
        <Search className="h-4 w-4" />
        {t("nav_quickSearch")}
      </Link>
    </nav>
  );
}
