"use client";

import Link from "@/components/i18n/LocalizedLink";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageMenu from "@/components/LanguageMenu";
import ThemeToggle from "@/components/ThemeToggle";
import AccountMenu from "@/components/auth/AccountMenu";
import { useT } from "@/components/i18n/LanguageProvider";
import SettingsLink from "@/components/settings/SettingsLink";
import { unlocalizedPath } from "@/lib/i18n-core";

const utilityClassName =
  "grid h-10 w-10 shrink-0 place-items-center rounded-chip text-ink/70 transition-colors hover:bg-tone hover:text-ink";

// Settings is the only route among the header utilities, so it alone can be the
// current page. Same active treatment as the side rail: dark chip, light glyph.
function utilityLinkClassName(isActive: boolean) {
  return isActive
    ? "grid h-10 w-10 shrink-0 place-items-center rounded-chip bg-ink text-cloud shadow-elev-2 transition-colors"
    : utilityClassName;
}

/**
 * Mobile top bar — a slim floating pill with the brand and utilities (theme,
 * language). Primary navigation lives in the bottom `MobileTabBar`. Shown only
 * below `lg`, where the persistent SideRail takes over.
 */
export default function SiteHeader() {
  const t = useT();
  const isSettings = unlocalizedPath(usePathname()) === "/settings";

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 [view-transition-name:site-header] sm:px-5 sm:pt-4 lg:hidden">
      <div className="glass glass-chrome mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-chip pl-5 pr-3">
        <Link
          className="group flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em] text-ink transition-opacity hover:opacity-80"
          href="/"
        >
          <Logo
            className="h-7 w-7 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6"
            idPrefix="hdr"
          />
          {/* Below 360px (iPhone SE, small Android) the brand wordmark plus
              four utilities overflow the pill — measured, not guessed: the
              settings gear landed outside it and the page scrolled sideways.
              The wordmark is what gives way, because the logo alone still
              identifies the app and a control pushed off the pill does not. */}
          <span className="max-[359px]:hidden">farms</span>
          <span className="text-pine-bright max-[359px]:hidden">.</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <AccountMenu placement="header" triggerClassName={utilityClassName} />
          <ThemeToggle />
          <LanguageMenu
            placement="header"
            triggerClassName={utilityClassName}
          />
          {/* Settings belongs here rather than in the bottom tab bar, which is
              primary navigation and — decisively — hides itself on scroll and
              goes inert. An entry that disappears while you read is a worse
              bug than the one it would be fixing. Here it keeps the same three
              neighbours it has in the desktop rail. */}
          <SettingsLink
            aria-current={isSettings ? "page" : undefined}
            aria-label={t("settings_title")}
            className={utilityLinkClassName(isSettings)}
            title={t("settings_title")}
          >
            <Settings className="h-5 w-5" />
          </SettingsLink>
        </div>
      </div>
    </header>
  );
}
