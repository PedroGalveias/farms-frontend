"use client";

import Link from "@/components/i18n/LocalizedLink";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  Command,
  Heart,
  Keyboard,
  LayoutGrid,
  Search,
  Settings,
} from "lucide-react";
import GitHubIcon from "@/components/icons/GitHubIcon";
import Logo from "@/components/Logo";
import LanguageMenu from "@/components/LanguageMenu";
import ThemeToggle from "@/components/ThemeToggle";
import AccountMenu from "@/components/auth/AccountMenu";
import { useSlidingIndicator } from "@/components/motion/useSlidingIndicator";
import { useT } from "@/components/i18n/LanguageProvider";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/command/events";
import { useModKey } from "@/components/command/useModKey";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { unlocalizedPath } from "@/lib/i18n-core";

const FRONTEND_REPO = "https://github.com/PedroGalveias/farms-frontend";

// The rail is now frosted glass (matching the mobile tab bar), so its contents
// use ink tones — active items ride a dark sliding pill (bg-ink) with a light
// (cloud) glyph, inactive items are muted ink.
function railLinkClassName(isActive: boolean) {
  return `relative z-10 grid h-11 w-11 place-items-center rounded-field transition-colors duration-300 ${
    isActive ? "text-cloud" : "text-ink/55 hover:bg-ink/5 hover:text-ink"
  }`;
}

const utilityClassName =
  "grid h-11 w-11 place-items-center rounded-field text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink";

// Settings is a route, unlike its neighbours in the utility cluster, so it can
// be the current page and has to be able to say so. It borrows the active
// treatment of the primary nav (dark pill, light glyph) without the sliding
// indicator, which is owned by — and positioned within — the <nav> above.
function utilityLinkClassName(isActive: boolean) {
  return isActive
    ? "grid h-11 w-11 place-items-center rounded-field bg-ink text-cloud shadow-elev-2 transition-colors"
    : utilityClassName;
}

/**
 * Persistent desktop utility rail, shown on every page (akukolabs-style):
 * logo, primary navigation, language switcher, and a source link. Fixed to
 * the left edge; page content is offset by its width in the layout. Hidden
 * below `lg`, where the floating pill header takes over.
 */
export default function SideRail() {
  // `usePathname` returns the real URL, locale segment and all, so every
  // comparison below has to be made against the unprefixed path — otherwise
  // nothing in the rail is ever "current" outside English.
  const pathname = unlocalizedPath(usePathname());
  const t = useT();
  const mod = useModKey();
  const { favoritesCount } = usePersonalization();
  // Tracked separately from `active` below: that drives the sliding indicator,
  // which is positioned inside the primary <nav>. Settings lives in the utility
  // cluster underneath it, so it needs its own current-page state.
  const isSettings = pathname === "/settings";
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
    <aside className="glass glass-chrome cursor-zone fixed bottom-3 left-3 top-3 z-40 hidden w-[64px] flex-col items-center justify-between rounded-panel py-5 [view-transition-name:site-rail] lg:flex">
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
          className="pointer-events-none absolute left-0 top-0 z-0 rounded-field bg-ink opacity-0 shadow-elev-2 transition-[transform,width,height,opacity] duration-[450ms] ease-[cubic-bezier(0.34,1.3,0.5,1)]"
          ref={indicatorRef}
        />
        <button
          className={`${utilityClassName} mb-1`}
          onClick={() =>
            window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
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
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-chip bg-pine-surface px-1 text-[10px] font-bold text-white">
              {favoritesCount}
            </span>
          ) : null}
        </Link>
      </nav>

      <div className="flex flex-col items-center gap-3">
        <AccountMenu placement="rail" triggerClassName={utilityClassName} />
        <ThemeToggle />
        <LanguageMenu placement="rail" triggerClassName={utilityClassName} />
        {/* Settings sits with the other preference controls rather than in the
            primary nav, and deliberately outside any auth check: everything on
            that page is a per-device preference (theme, motion, locale, data),
            none of which requires an account. Until now the only route to it
            was through /profile, which the account menu only offers once you
            are signed in — so a signed-out visitor could not reach their own
            theme settings without typing the URL. */}
        <Link
          aria-current={isSettings ? "page" : undefined}
          className={utilityLinkClassName(isSettings)}
          href="/settings"
          title={t("settings_title")}
        >
          <Settings className="h-5 w-5" />
        </Link>
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
