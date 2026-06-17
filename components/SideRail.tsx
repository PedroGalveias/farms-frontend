"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, LayoutGrid, Search } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageMenu from "@/components/LanguageMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { useT } from "@/components/i18n/LanguageProvider";

const FRONTEND_REPO = "https://github.com/PedroGalveias/farms-frontend";

// The rail background is dark (ink) in light mode and green in dark mode, so
// its contents use fixed-light colors that read on both.
function railLinkClassName(isActive: boolean) {
  return `grid h-11 w-11 place-items-center rounded-2xl transition-colors duration-300 ${
    isActive
      ? "bg-white text-[#14161b]"
      : "text-white/55 hover:bg-white/10 hover:text-white"
  }`;
}

const utilityClassName =
  "grid h-11 w-11 place-items-center rounded-2xl text-white/55 transition-colors hover:bg-white/10 hover:text-white";

/**
 * Persistent desktop utility rail, shown on every page (akukolabs-style):
 * logo, primary navigation, language switcher, and a source link. Fixed to
 * the left edge; page content is offset by its width in the layout. Hidden
 * below `lg`, where the floating pill header takes over.
 */
export default function SideRail() {
  const pathname = usePathname();
  const t = useT();
  const active =
    pathname === "/quick-search"
      ? "quick-search"
      : pathname === "/"
        ? "directory"
        : undefined;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[76px] flex-col items-center justify-between border-r border-white/10 bg-rail py-6 transition-colors duration-300 lg:flex">
      <Link
        aria-label="farms — home"
        className="block h-11 w-11 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-6 hover:scale-105"
        href="/"
      >
        <Logo className="h-11 w-11" idPrefix="rail" />
      </Link>

      <nav aria-label="Primary" className="flex flex-col items-center gap-2">
        <Link
          aria-current={active === "directory" ? "page" : undefined}
          className={railLinkClassName(active === "directory")}
          href="/"
          title={t("nav_directory")}
        >
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <Link
          aria-current={active === "quick-search" ? "page" : undefined}
          className={railLinkClassName(active === "quick-search")}
          href="/quick-search"
          title={t("nav_quickSearch")}
        >
          <Search className="h-5 w-5" />
        </Link>
      </nav>

      <div className="flex flex-col items-center gap-3">
        <ThemeToggle />
        <LanguageMenu placement="rail" triggerClassName={utilityClassName} />
        <a
          aria-label={t("rail_source")}
          className={utilityClassName}
          href={FRONTEND_REPO}
          rel="noreferrer"
          target="_blank"
          title={t("rail_source")}
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </aside>
  );
}
