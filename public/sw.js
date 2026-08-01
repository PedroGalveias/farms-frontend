// Minimal service worker for the farms directory — no build tooling, no deps.
//
// Strategy:
//   • Navigations (pages): network-first, falling back to the last cached copy
//     of that page, then to a generic offline page. This is what makes the
//     directory you last loaded available "in the field" with no signal.
//   • Static assets (/_next/static, fonts, images): cache-first, revalidated in
//     the background.
//
// Bump CACHE_VERSION to invalidate everything on a breaking change.
const CACHE_VERSION = "farms-cache-v2";
const OFFLINE_URL = "/offline";
const FARMS_API_URL = "/api/farms";

self.addEventListener("install", (event) => {
  // Don't skipWaiting here: an updated worker should *wait* so the page can
  // offer a "refresh to update" banner, and only take over when the user opts
  // in (SKIP_WAITING below). The first-ever worker has nothing to wait behind,
  // so it still activates immediately.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.add(OFFLINE_URL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Let the app's update banner activate a newly installed worker immediately.
self.addEventListener("message", (event) => {
  // 1. Explicitly verify that the message comes from the same origin
  if (event.origin !== self.location.origin) {
    return;
  }

  // Only honor messages from same-origin clients.
  const sourceClient = event.source;
  if (!sourceClient || !sourceClient.url) {
    return;
  }

  let sourceUrl;
  try {
    sourceUrl = new URL(sourceClient.url);
  } catch {
    return;
  }

  if (sourceUrl.origin !== self.location.origin) {
    return;
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|gif|ico|webp)$/.test(url.pathname)
  );
}

// Keep cache writes alive after the response has been handed to the page.
// Without waitUntil, a worker may be stopped before cache.put finishes — most
// visible on a slow device as an unexpectedly empty offline cache. Never let a
// failed best-effort cache write affect the network response.
function cacheResponse(request, response) {
  if (!response.ok) {
    return Promise.resolve();
  }

  return caches
    .open(CACHE_VERSION)
    .then((cache) => cache.put(request, response.clone()));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs; let everything else (APIs, tiles, POSTs) pass
  // straight through to the network.
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    const network = fetch(request);
    // Register the lifetime extension synchronously. Calling waitUntil only
    // after fetch resolves is too late in some browsers.
    event.waitUntil(
      network
        .then((response) => cacheResponse(request, response))
        .catch(() => undefined),
    );
    event.respondWith(
      network.catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match(OFFLINE_URL);
      }),
    );
    return;
  }

  if (url.pathname === FARMS_API_URL) {
    const network = fetch(request);
    event.waitUntil(
      network
        .then((response) => cacheResponse(request, response))
        .catch(() => undefined),
    );
    event.respondWith(
      network.catch(async () => {
        const cached = await caches.match(request);
        return (
          cached ||
          new Response(JSON.stringify({ error: "Farm data unavailable." }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
          })
        );
      }),
    );
    return;
  }

  if (isCacheableAsset(url)) {
    // Start revalidation immediately, even for a cache hit. Its lifetime is
    // registered while the fetch event is still being dispatched.
    const network = fetch(request);
    event.waitUntil(
      network
        .then((response) => cacheResponse(request, response))
        .catch(() => undefined),
    );
    event.respondWith(
      caches.match(request).then((cached) => {
        // Serve a cached asset immediately, then refresh it in the
        // background. This keeps repeat visits fast without pinning a user
        // to a stale hashed asset should a deployment change its contents.
        if (cached) {
          // The revalidation is deliberately detached from the response;
          // failures should not turn a valid cached asset into an error.
          return cached;
        }

        return network;
      }),
    );
  }
});
