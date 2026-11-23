/**
 * Ummah Library service worker — offline reading.
 *
 * - Static assets (_next/static, fonts, icons): cache-first (stale-while-revalidate).
 * - Page navigations: network-first, falling back to a cached copy, then the
 *   offline page. So any surah you've opened stays readable without a network.
 */
// Pages keep their cache across updates (offline copies of surahs you've read);
// the static cache moved to v2 when it gained a size cap, dropping the old
// unbounded one.
const PAGE_CACHE = "ul-pages-v1";
const STATIC_CACHE = "ul-static-v2";
const CURRENT = [PAGE_CACHE, STATIC_CACHE];
// Each deploy adds new hashed chunks; keep only the most recent ones so the
// cache can't grow without bound (a bloated origin risks the browser evicting
// all of its storage, offline audio included).
const STATIC_MAX = 300;
const PRECACHE = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !CURRENT.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

/** Drop the oldest entries beyond `max` (Cache keys come back in insertion order). */
async function trim(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static") ||
  url.pathname.startsWith("/icons/") ||
  /\.(?:js|css|woff2?|png|svg|ico|webmanifest)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          // Never keep an error page as the offline copy.
          if (response.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match("/offline")) ||
            (await caches.match("/"))
          );
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              void cache.put(request, response.clone()).then(() => trim(cache, STATIC_MAX));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })(),
    );
  }
});
