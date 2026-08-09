/**
 * Thin client over the public REST API (ADR 0004). The mobile app is
 * online-first (ADR 0009): every screen reads through these helpers. Responses
 * map onto the shared `core` entities so types stay honest end to end.
 *
 * Content fetches (surah text, translations, tafsir, hadith, and the
 * reference lists that drive them) are wrapped in `readThrough` (see
 * `offlineCache.ts`, issue #223): a successful response is cached to disk via
 * `expo-file-system`, and a failed fetch falls back to the last cached
 * response for that request instead of leaving a returning-offline reader
 * with nothing. `getPrayerTimes` is deliberately NOT cached — it's a live
 * value computed from today's date/location, not stable content a reader
 * "opened"; serving a stale cached prayer time silently would be actively
 * wrong rather than merely unavailable.
 */
import type {
  Ayah,
  DivineName,
  Dhikr,
  HadithSection,
  Place,
  Surah,
  TafsirEntry,
  TextDirection,
  TranslatedAyah,
  Translation,
} from "@ummahlibrary/core";
import { readThrough } from "./offlineCache";
import { CACHE_KEYS } from "./offlineCacheManifest";

const BASE =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://ummahlibrary.org/api/v1").replace(
    /\/$/,
    "",
  );

/** A tafsir edition as listed by `/tafsirs`. */
export interface TafsirMeta {
  id: string;
  name: string;
  author: string;
  language: string;
  direction: TextDirection;
}

/**
 * Distinguishes a genuine connectivity failure (`fetch` itself rejected) from
 * an HTTP error response, so callers can show accurate copy instead of a
 * blanket "check your connection" for e.g. a backend cold-start 503.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly isNetworkError: boolean;
  constructor(message: string, opts: { status?: number; isNetworkError: boolean }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.isNetworkError = opts.isNetworkError;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry transient 5xx responses (e.g. a backend cold start) with a short
// backoff before surfacing an error; client errors and real network failures
// (offline) aren't retried since another attempt won't fix them.
const RETRY_DELAYS_MS = [400, 1200];

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const retryable = res.status >= 500 && attempt < RETRY_DELAYS_MS.length;
        if (retryable) {
          await sleep(RETRY_DELAYS_MS[attempt]!);
          continue;
        }
        throw new ApiError(`HTTP ${res.status}`, { status: res.status, isNetworkError: false });
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]!);
        continue;
      }
      throw new ApiError(e instanceof Error ? e.message : "Network request failed", {
        isNetworkError: true,
      });
    }
  }
}

export const api = {
  listSurahs: () =>
    readThrough(CACHE_KEYS.surahs(), () =>
      getJson<{ surahs: Surah[] }>(`${BASE}/surahs`).then((d) => d.surahs),
    ),
  getSurah: (n: number) =>
    readThrough(CACHE_KEYS.surah(n), () =>
      getJson<{ surah: Surah; ayahs: Ayah[] }>(`${BASE}/surahs/${n}`),
    ),
  /** Bundled word-by-word recitation timings for a reciter+surah (ADR 0036).
   *  Resolves to null when the reciter/surah isn't covered (caller falls back to live). */
  getTimings: (reciterId: string, n: number) =>
    readThrough(CACHE_KEYS.timings(reciterId, n), () =>
      getJson<{ ayahs?: Record<string, [number, number, number][]> }>(
        `${BASE}/recitations/${reciterId}/surahs/${n}/timings`,
      ),
    ).catch(() => null),
  getTranslation: (n: number, edition: string) =>
    readThrough(CACHE_KEYS.translation(edition, n), () =>
      getJson<{ ayahs: TranslatedAyah[] }>(`${BASE}/surahs/${n}/translations/${edition}`).then(
        (d) => d.ayahs,
      ),
    ),
  listEditions: () =>
    readThrough(CACHE_KEYS.editions(), () =>
      getJson<{ editions: Translation[] }>(`${BASE}/editions`).then((d) => d.editions),
    ),
  /** The full runtime translation catalogue (~490 editions — ADR 0011). */
  listTranslationCatalog: () =>
    readThrough(CACHE_KEYS.translationCatalog(), () =>
      getJson<{ translations: Translation[] }>(`${BASE}/translations`).then(
        (d) => d.translations,
      ),
    ),
  /** A catalogue edition's text for one surah, fetched at runtime. */
  getCatalogTranslation: (edition: string, n: number) =>
    readThrough(CACHE_KEYS.catalogTranslation(edition, n), () =>
      getJson<{ ayahs: TranslatedAyah[] }>(`${BASE}/translations/${edition}/surahs/${n}`).then(
        (d) => d.ayahs,
      ),
    ),
  listTafsirs: () =>
    readThrough(CACHE_KEYS.tafsirs(), () =>
      getJson<{ tafsirs: TafsirMeta[] }>(`${BASE}/tafsirs`).then((d) => d.tafsirs),
    ),
  getTafsir: (n: number, edition: string) =>
    readThrough(CACHE_KEYS.tafsir(edition, n), () =>
      getJson<{ entries: TafsirEntry[] }>(`${BASE}/surahs/${n}/tafsirs/${edition}`).then(
        (d) => d.entries,
      ),
    ),
  getHadithSection: (collection: string, section: number) =>
    readThrough(CACHE_KEYS.hadithSection(collection, section), () =>
      getJson<HadithSection>(`${BASE}/hadith/${collection}/sections/${section}`),
    ),
  listNames: () =>
    readThrough(CACHE_KEYS.names(), () =>
      getJson<{ names: DivineName[] }>(`${BASE}/names`).then((d) => d.names),
    ),
  listAdhkar: () =>
    readThrough(CACHE_KEYS.adhkar(), () =>
      getJson<{ dhikr: Dhikr[] }>(`${BASE}/adhkar`).then((d) => d.dhikr),
    ),
  /** The full Arabic corpus (all 6,236 āyāt) for the client search index. */
  getSearchCorpus: () =>
    readThrough(CACHE_KEYS.searchCorpus(), () =>
      getJson<{ verses: { s: number; a: number; t: string }[] }>(`${BASE}/search/corpus`).then(
        (d) => d.verses,
      ),
    ),
  /** Not cached — see the module doc comment. */
  getPrayerTimes: (params: {
    lat: number;
    lng: number;
    date: string;
    method: string;
    madhab: string;
    hlr?: string;
  }) => {
    const q = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
      date: params.date,
      method: params.method,
      madhab: params.madhab,
      ...(params.hlr ? { hlr: params.hlr } : {}),
    });
    return getJson<{ timings: Record<string, string> }>(`${BASE}/prayer-times?${q}`).then(
      (d) => d.timings,
    );
  },
  /** Nearby mosques via OpenStreetMap's Overpass API, proxied server-side (ADR 0038). */
  getNearbyMosques: (params: { lat: number; lng: number; radius?: number }) => {
    const q = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
      ...(params.radius ? { radius: String(params.radius) } : {}),
    });
    return getJson<{ places: Place[]; radiusMeters: number; attribution: string }>(
      `${BASE}/places/nearby?${q}`,
    );
  },
};
