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
const CACHE_VERSION = "farms-cache-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
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

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|gif|ico|webp)$/.test(url.pathname)
  );
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
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
