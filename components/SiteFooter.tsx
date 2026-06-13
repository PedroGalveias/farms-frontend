import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line/70">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-sm">
            <p className="flex items-center text-3xl font-extrabold tracking-[-0.04em] text-ink">
              farms<span className="text-pine-bright">.</span>
            </p>
            <p className="mt-4 text-[15px] leading-7 text-ink/50">
              Fresh products, direct from Swiss farms — find what you need at the
              farm nearest to you.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-16 gap-y-3 text-[15px]"
          >
            <Link
              className="group inline-flex items-center gap-1 font-semibold text-ink/70 transition-colors hover:text-ink"
              href="/"
            >
              Directory
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
            <Link
              className="group inline-flex items-center gap-1 font-semibold text-ink/70 transition-colors hover:text-ink"
              href="/quick-search"
            >
              Quick search
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          </nav>
        </div>

        {/* Oversized wordmark — a quiet, confident signature. */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-14 select-none text-[19vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-ink/[0.05] sm:text-[15vw]"
        >
          farms.
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-line/70 pt-6 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Swiss farms directory</p>
          <p>Made for the road — eggs, fruit, and everything fresh.</p>
        </div>
      </div>
    </footer>
  );
}
