import { NextResponse, type NextRequest } from "next/server";

// Locale routing (Next's request proxy, formerly `middleware`). English is canonical and unprefixed (/canton/be); the other
// locales live under a segment (/de/canton/be). Every page component sits in
// app/[lang], so:
//
// - /de|/fr|/it|/rm/…  → pass through (the segment is the [lang] param).
// - /en/…              → 308 to the unprefixed URL (one canonical English URL).
// - anything else      → rewrite to /en/… internally (URL stays clean) —
//                        unless the visitor picked another language earlier
//                        (farms.locale cookie), in which case 307 to it, so
//                        the choice is sticky across visits and shared links.
//                        Crawlers carry no cookie and always get English plus
//                        hreflang alternates.

const PREFIXED = ["de", "fr", "it", "rm"];
const COOKIE = "farms.locale";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first, ...rest] = pathname.split("/");

  if (PREFIXED.includes(first)) {
    return NextResponse.next();
  }

  if (first === "en") {
    const url = request.nextUrl.clone();
    url.pathname = `/${rest.join("/")}`;
    return NextResponse.redirect(url, 308);
  }

  const preferred = request.cookies.get(COOKIE)?.value;
  if (preferred && PREFIXED.includes(preferred)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip API routes, Next internals, and anything with a file extension
  // (favicons, icons, sw.js, screenshots…) plus the metadata routes.
  matcher: [
    "/((?!api|_next|.*\\..*|apple-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
