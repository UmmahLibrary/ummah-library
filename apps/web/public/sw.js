/**
 * Ummah Library service worker — offline reading.
 *
 * - Static assets (_next/static, fonts, icons): cache-first (stale-while-revalidate).
 * - Page navigations: network-first, falling back to a cached copy, then the
 *   offline page. So any surah you've opened stays readable without a network.
 * - Reader content APIs (tafsir, translations, related hadith, hadith, names…):
 *   network-first, falling back to the last copy — so a tafsir or hadith you've
 *   opened also opens offline. Location-bearing APIs are never cached.
 */
// Pages keep their cache across updates (offline copies of surahs you've read);
// the static cache moved to v2 when it gained a size cap, dropping the old
// unbounded one.
const PAGE_CACHE = "ul-pages-v1";
const STATIC_CACHE = "ul-static-v2";
const API_CACHE = "ul-api-v1";
const CURRENT = [PAGE_CACHE, STATIC_CACHE, API_CACHE];
// Only caches this worker owns are pruned on update. Others on the origin —
// above all the app's offline recitations ("ul-audio-v1") — are not ours to drop.
const OWNED = /^ul-(pages|static|api)-v\d+$/;
const API_MAX = 120;
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
      await Promise.all(
        keys.filter((k) => OWNED.test(k) && !CURRENT.includes(k)).map((k) => caches.delete(k)),
      );
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

// Public reader content. Not prayer-times / places (they carry the user's
// coordinates and go stale), not sync (POST, private), and not whole hadith
// collections (~12 MB each, six prefetched by the Hadith page) — that would
// bloat the origin toward eviction, offline audio included.
const isContentApi = (url) =>
  /^\/api\/v1\/(surahs|translations|tafsirs|names|adhkar|editions|search\/corpus|recitations|hadith\/[^/]+\/sections)(\/|$)/.test(
    url.pathname,
  );

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

  if (isContentApi(url)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(API_CACHE);
            void cache.put(request, response.clone()).then(() => trim(cache, API_MAX));
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw new Error("offline");
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
