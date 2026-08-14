import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import GlobalNotFoundContent from "@/components/GlobalNotFoundContent";
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
// The server fallback is English, then GlobalNotFoundContent reads a supported
// first URL segment after hydration. That keeps this boundary static while a
// genuine `/de/...` or `/fr/...` miss still gets matching copy and home link.
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
        <GlobalNotFoundContent />
      </body>
    </html>
  );
}
