import { notFound } from "next/navigation";

// Render per-request: a statically (on-demand) generated catch-all can serve
// its cached 404 page with a 200 status; dynamic rendering guarantees the
// real 404 status code every time (same as farm/[id]'s notFound()).
export const dynamic = "force-dynamic";

/**
 * Catch-all inside [lang]: any URL that matches no real route lands here and
 * throws to the segment's localized not-found page. Without this, unmatched
 * paths would fall through to Next's default (unlocalized) 404, since the
 * app's not-found boundary lives inside the [lang] segment.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
