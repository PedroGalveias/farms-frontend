import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import GoBackButton from "@/components/GoBackButton";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

// Served for URLs that match no route at all.
//
// This used to be an app/[lang]/[...rest] catch-all whose page called
// notFound(), so that a real segment matched and app/[lang]/not-found.tsx could
// render inside the localised layout. That catch-all cannot be prerendered
// under Cache Components — the build aborts with a "Render in Browser" CSR
// bailout raised inside Next itself, with no application frame in the stack,
// and it does so whatever the page renders. A plain route calling notFound()
// prerenders fine, so the problem is the catch-all, not notFound().
//
// global-not-found renders OUTSIDE the [lang] layout and so brings its own
// <html>/<body>. That is a real trade-off: no header, no side rail, no tab bar
// on the 404. It keeps what the page actually had — the brand type, the theme,
// the go-back button — and drops chrome that pointed at a page the visitor is
// not on. app/[lang]/not-found.tsx still handles notFound() from inside a
// matched route, where the full layout is present and correct.
//
// The copy is English here as it was before: the old catch-all sat under
// [lang], but the 404 body was never translated, and an unmatched URL has no
// reliable locale to translate into.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Page not found · farms.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={archivo.variable}>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <div className="relative overflow-clip">
          <main className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
            <p className="rise-in text-xs font-bold uppercase tracking-[0.18em] text-pine">
              Error 404
            </p>
            <h1
              className="rise-in mt-5 max-w-3xl text-display font-extrabold leading-[0.9] tracking-[-0.045em] text-ink"
              style={{ ["--rise-delay" as string]: "80ms" }}
            >
              This page wandered <span className="text-pine">off the map.</span>
            </h1>
            <p
              className="rise-in mt-6 max-w-xl text-lg leading-8 text-ink/60"
              style={{ ["--rise-delay" as string]: "180ms" }}
            >
              The page you&apos;re looking for isn&apos;t here. Head back to
              where you were, or start again from the directory.
            </p>

            <div
              className="rise-in mt-9 flex flex-wrap items-center gap-3"
              style={{ ["--rise-delay" as string]: "260ms" }}
            >
              <GoBackButton label="Go back" />
              {/* A real document load, not a <Link>. This page renders
                  outside the [lang] layout, so there is no app shell for a
                  client-side transition to happen inside — the directory needs
                  the providers and chrome this document does not have. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                className="text-sm font-bold text-pine underline underline-offset-4"
                href="/"
              >
                Go to the directory
              </a>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
