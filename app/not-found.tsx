import Link from "next/link";
import { ArrowLeft, Compass, Leaf, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_top_left,rgba(233,201,107,0.24),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(159,197,214,0.3),transparent_26%),radial-gradient(circle_at_48%_35%,rgba(126,168,108,0.14),transparent_30%)]" />

      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.6rem] border border-white/60 bg-[linear-gradient(140deg,#23513e_0%,#2d6c54_36%,#87a86a_100%)] px-6 py-8 text-white shadow-[0_36px_100px_rgba(31,42,33,0.18)] sm:px-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-6 top-2 h-56 w-56 rounded-full bg-sky/25 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-20 h-48 w-48 rounded-full bg-sun/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/78">
                <Leaf className="h-4 w-4" />
                Swiss farms
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/62">
                Error 404
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl leading-[0.92] sm:text-6xl">
                This page wandered off the map.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                The route you requested is not available. You can head back to
                the farm directory or jump into the quick-search flow instead.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest shadow-[0_14px_34px_rgba(18,39,31,0.18)] transition hover:bg-[#f7fbf1]"
                  href="/"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to directory
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                  href="/quick-search"
                >
                  <Search className="h-4 w-4" />
                  Open quick search
                </Link>
              </div>
            </div>

            <article className="rounded-[1.85rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(233,201,107,0.18))] p-6 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/14 p-3">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mt-3 text-3xl leading-none">
                    A cleaner way back.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/78">
                    Use the main directory for a broad browse, or open the
                    stacked leaf quick-search experience if you already know the
                    products you want to find.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.8rem] border border-border bg-white/78 p-6 shadow-[0_24px_60px_rgba(31,42,33,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/55">
              Browse the directory
            </p>
            <h2 className="mt-3 text-3xl leading-none text-forest">
              Search farms by name, location, or category.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              The homepage gives you the full directory with filters, sorting,
              and quick category shortcuts for faster scanning.
            </p>
          </article>

          <article className="rounded-[1.8rem] border border-border bg-white/78 p-6 shadow-[0_24px_60px_rgba(31,42,33,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-forest/55">
              Use quick-search
            </p>
            <h2 className="mt-3 text-3xl leading-none text-forest">
              Find farms by product in a faster interactive flow.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/70">
              Share a location, pick products, and move through the animated
              leaf experience to get nearby matches quickly.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
