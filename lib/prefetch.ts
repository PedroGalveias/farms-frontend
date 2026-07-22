/**
 * Warm the farm-detail experience before it's needed (design §7 — "instant
 * navigation: prefetch on hover / long-press-start so the sheet opens with
 * content already there; the morph should never reveal a spinner").
 *
 * The farm object itself is already in memory (the directory holds the full
 * dataset client-side), so the detail sheet's text/products/photos paint
 * immediately. The one lazily-loaded piece is the Leaflet map chunk, which
 * otherwise shows a MapPlaceholder for a beat after the sheet opens. Kicking
 * off that dynamic import on intent (hover, or the very start of a long-press)
 * means the chunk is usually parsed by the time the sheet morphs in.
 *
 * Idempotent and best-effort: the import promise is cached after the first
 * call, and a rejection (offline, chunk 404 after a deploy) is swallowed — a
 * prefetch must never surface an error; the real open path handles loading.
 */
let mapChunk: Promise<unknown> | null = null;

export function prefetchFarmDetail(): void {
  if (mapChunk || typeof window === "undefined") return;
  // Same specifier as FarmDetail's `dynamic(() => import("@/components/FarmsMap"))`,
  // so the webpack/turbopack chunk id matches and the open path reuses it.
  mapChunk = import("@/components/FarmsMap").catch(() => {
    // Let a later open retry; don't cache a failed prefetch.
    mapChunk = null;
  });
}
