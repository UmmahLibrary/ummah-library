/**
 * Thin client over the public REST API (ADR 0004). The mobile app is
 * online-first (ADR 0009): every screen reads through these helpers. Responses
 * map onto the shared `core` entities so types stay honest end to end.
 */
import type {
  Ayah,
  DivineName,
  Dhikr,
  HadithSection,
  Surah,
  TafsirEntry,
  TextDirection,
  TranslatedAyah,
  Translation,
} from "@ummahlibrary/core";

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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  listSurahs: () => getJson<{ surahs: Surah[] }>(`${BASE}/surahs`).then((d) => d.surahs),
  getSurah: (n: number) => getJson<{ surah: Surah; ayahs: Ayah[] }>(`${BASE}/surahs/${n}`),
  /** Bundled word-by-word recitation timings for a reciter+surah (ADR 0036).
   *  Resolves to null when the reciter/surah isn't covered (caller falls back to live). */
  getTimings: (reciterId: string, n: number) =>
    getJson<{ ayahs?: Record<string, [number, number, number][]> }>(
      `${BASE}/recitations/${reciterId}/surahs/${n}/timings`,
    ).catch(() => null),
  getTranslation: (n: number, edition: string) =>
    getJson<{ ayahs: TranslatedAyah[] }>(`${BASE}/surahs/${n}/translations/${edition}`).then(
      (d) => d.ayahs,
    ),
  listEditions: () =>
    getJson<{ editions: Translation[] }>(`${BASE}/editions`).then((d) => d.editions),
  /** The full runtime translation catalogue (~490 editions — ADR 0011). */
  listTranslationCatalog: () =>
    getJson<{ translations: Translation[] }>(`${BASE}/translations`).then((d) => d.translations),
  /** A catalogue edition's text for one surah, fetched at runtime. */
  getCatalogTranslation: (edition: string, n: number) =>
    getJson<{ ayahs: TranslatedAyah[] }>(`${BASE}/translations/${edition}/surahs/${n}`).then(
      (d) => d.ayahs,
    ),
  listTafsirs: () => getJson<{ tafsirs: TafsirMeta[] }>(`${BASE}/tafsirs`).then((d) => d.tafsirs),
  getTafsir: (n: number, edition: string) =>
    getJson<{ entries: TafsirEntry[] }>(`${BASE}/surahs/${n}/tafsirs/${edition}`).then(
      (d) => d.entries,
    ),
  getHadithSection: (collection: string, section: number) =>
    getJson<HadithSection>(`${BASE}/hadith/${collection}/sections/${section}`),
  listNames: () => getJson<{ names: DivineName[] }>(`${BASE}/names`).then((d) => d.names),
  listAdhkar: () => getJson<{ dhikr: Dhikr[] }>(`${BASE}/adhkar`).then((d) => d.dhikr),
  /** The full Arabic corpus (all 6,236 āyāt) for the client search index. */
  getSearchCorpus: () =>
    getJson<{ verses: { s: number; a: number; t: string }[] }>(`${BASE}/search/corpus`).then(
      (d) => d.verses,
    ),
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
};
