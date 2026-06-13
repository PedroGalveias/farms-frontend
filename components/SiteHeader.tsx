import Link from "next/link";
import type { ReactNode } from "react";

interface SiteHeaderProps {
  active?: "directory" | "quick-search";
  statusBadge?: ReactNode;
}

function navLinkClassName(isActive: boolean) {
  return `whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors duration-300 ${
    isActive
      ? "bg-ink text-cloud shadow-[0_4px_12px_-4px_rgba(20,22,27,0.5)]"
      : "text-ink/55 hover:text-ink"
  }`;
}

export default function SiteHeader({ active, statusBadge }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border border-line/80 bg-cloud/70 pl-5 pr-2.5 shadow-[0_1px_2px_rgba(20,22,27,0.04),0_18px_40px_-24px_rgba(20,22,27,0.25)] backdrop-blur-xl">
        <Link
          className="group flex items-center gap-2 text-[19px] font-extrabold tracking-[-0.04em] text-ink transition-opacity hover:opacity-80"
          href="/"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-ink text-cloud transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-12">
            <span className="font-accent text-[15px] not-italic leading-none">
              f
            </span>
          </span>
          farms
          <span className="text-pine-bright">.</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {statusBadge ? (
            <span className="hidden md:inline-flex">{statusBadge}</span>
          ) : null}

          <nav
            aria-label="Main navigation"
            className="flex items-center gap-0.5 rounded-full bg-tone/70 p-1"
          >
            <Link
              aria-current={active === "directory" ? "page" : undefined}
              className={navLinkClassName(active === "directory")}
              href="/"
            >
              Directory
            </Link>
            <Link
              aria-current={active === "quick-search" ? "page" : undefined}
              className={navLinkClassName(active === "quick-search")}
              href="/quick-search"
            >
              Quick search
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
