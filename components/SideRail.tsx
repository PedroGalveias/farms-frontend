"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Command, Heart, Keyboard, LayoutGrid, Search } from "lucide-react";
import GitHubIcon from "@/components/icons/GitHubIcon";
import Logo from "@/components/Logo";
import LanguageMenu from "@/components/LanguageMenu";
import ThemeToggle from "@/components/ThemeToggle";
import AccountMenu from "@/components/auth/AccountMenu";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import { useT } from "@/components/i18n/LanguageProvider";
import { useModKey } from "@/components/command/useModKey";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";

const FRONTEND_REPO = "https://github.com/PedroGalveias/farms-frontend";

// The rail background is dark (ink) in light mode and green in dark mode, so
// its contents use fixed-light colors that read on both.
function railLinkClassName(isActive: boolean) {
  return `relative z-10 grid h-11 w-11 place-items-center rounded-2xl transition-colors duration-300 ${
    isActive
      ? "text-[#14161b]"
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
  const mod = useModKey();
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
  const searchLinkRef = useRef<HTMLAnchorElement>(null);
  const savedRef = useRef<HTMLAnchorElement>(null);
  const activeRef =
    active === "directory"
      ? directoryRef
      : active === "quick-search"
        ? searchLinkRef
        : active === "saved"
          ? savedRef
          : null;

  useSlidingIndicator(navRef, activeRef, indicatorRef, active);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[76px] flex-col items-center justify-between border-r border-white/10 bg-rail py-6 transition-colors duration-300 lg:flex">
      <Link
        aria-label="farms — home"
        className="block h-11 w-11 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-rotate-6 hover:scale-105"
        href="/"
      >
        <Logo className="h-11 w-11" idPrefix="rail" />
      </Link>

      <nav
        aria-label="Primary"
        className="relative flex flex-col items-center gap-2"
        ref={navRef}
      >
        {/* Sliding active pill, positioned by useSlidingIndicator. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-0 rounded-2xl bg-white opacity-0 transition-[transform,width,height,opacity] duration-[450ms] ease-[cubic-bezier(0.34,1.3,0.5,1)]"
          ref={indicatorRef}
        />
        <button
          className={`${utilityClassName} mb-1`}
          onClick={() =>
            window.dispatchEvent(new CustomEvent("farms:command-open"))
          }
          title={`${t("command_open")} (${mod === "⌘" ? "⌘K" : "Ctrl+K"})`}
          type="button"
        >
          {/* ⌘ is a Mac glyph — on Windows/Linux (Ctrl) show a neutral icon. */}
          {mod === "⌘" ? (
            <Command className="h-5 w-5" />
          ) : (
            <Keyboard className="h-5 w-5" />
          )}
        </button>
        <Link
          aria-current={active === "directory" ? "page" : undefined}
          className={railLinkClassName(active === "directory")}
          href="/"
          ref={directoryRef}
          title={t("nav_directory")}
        >
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <Link
          aria-current={active === "quick-search" ? "page" : undefined}
          className={railLinkClassName(active === "quick-search")}
          href="/quick-search"
          ref={searchLinkRef}
          title={t("nav_quickSearch")}
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          aria-current={active === "saved" ? "page" : undefined}
          className={railLinkClassName(active === "saved")}
          href="/saved"
          ref={savedRef}
          title={t("saved_title")}
        >
          <Heart className="h-5 w-5" />
          {favoritesCount > 0 ? (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pine-surface px-1 text-[10px] font-bold text-white">
              {favoritesCount}
            </span>
          ) : null}
        </Link>
      </nav>

      <div className="flex flex-col items-center gap-3">
        <AccountMenu placement="rail" triggerClassName={utilityClassName} />
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
          <GitHubIcon className="h-5 w-5" />
        </a>
      </div>
    </aside>
  );
}
