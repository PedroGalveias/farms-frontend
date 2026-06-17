import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass, Search } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export default function NotFoundPage() {
  return (
    <div className="relative overflow-clip">
      <main className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
        <p className="rise-in text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Error 404
        </p>
        <h1
          className="rise-in mt-5 max-w-3xl text-[clamp(3rem,9vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-ink"
          style={{ ["--rise-delay" as string]: "80ms" }}
        >
          This page wandered <span className="text-pine">off the map.</span>
        </h1>
        <p
          className="rise-in mt-6 max-w-xl text-lg leading-8 text-ink/55"
          style={{ ["--rise-delay" as string]: "180ms" }}
        >
          The route you requested is not available. Head back to the farm
          directory, or jump straight into quick search.
        </p>

        <div
          className="rise-in mt-9 flex flex-wrap gap-3"
          style={{ ["--rise-delay" as string]: "260ms" }}
        >
          <Link
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            href="/"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to directory
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/75 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98]"
            href="/quick-search"
          >
            <Search className="h-4 w-4" />
            Open quick search
          </Link>
        </div>

        <div
          className="rise-in mt-16 grid gap-4 sm:grid-cols-2"
          style={{ ["--rise-delay" as string]: "360ms" }}
        >
          {[
            {
              body: "The full list of farms with search, canton and category filters, and sorting.",
              href: "/",
              icon: Compass,
              title: "Browse the directory",
            },
            {
              body: "Set your location, pick products, and get the nearest matching farms in three steps.",
              href: "/quick-search",
              icon: Search,
              title: "Use quick search",
            },
          ].map(({ body, href, icon: Icon, title }) => (
            <Link
              className="group rounded-[28px] border border-line bg-cloud p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-ink/15 hover:shadow-[0_30px_60px_-30px_rgba(20,22,27,0.4)]"
              href={href}
              key={title}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pine/10 text-pine">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-ink/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-[-0.03em] text-ink">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">{body}</p>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
