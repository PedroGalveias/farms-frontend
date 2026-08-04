import { notFound } from "next/navigation";

/**
 * Catch-all inside [lang]: any URL that matches no real route lands here and
 * throws to the segment's localized not-found page. Without this, unmatched
 * paths would fall through to Next's default (unlocalized) 404, since the
 * app's not-found boundary lives inside the [lang] segment.
 *
 * KNOWN BLOCKER under Cache Components — see the PR description. This route
 * cannot currently be prerendered, and the cause is not here: the root layout
 * awaits `params` to resolve the locale for <html lang> and LanguageProvider,
 * and on a route whose deeper params are unknown that await has nothing to
 * resolve against. Fixing it means changing how locale reaches the provider
 * tree, which is an i18n design decision rather than a mechanical migration.
 */
export function generateStaticParams() {
  // Cache Components rejects an empty list; it needs one sample to validate
  // the shell against. Any real path reaching here is a 404 either way.
  return [{ rest: ["not-found"] }];
}

export default function CatchAllNotFound(): never {
  notFound();
}
