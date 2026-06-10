/**
 * Thin client over the public REST API (ADR 0004). The mobile app is
 * online-first (ADR 0009): every screen reads through these helpers. Responses
 * map onto the shared `core` entities so types stay honest end to end.
 */
import type {
  Ayah,
  DivineName,
  HadithSection,
  Surah,
  TafsirEntry,
  TextDirection,
  TranslatedAyah,
  Translation,
} from "@ummahlibrary/core";

const BASE = "https://app.ummahlibrary.org/api/v1";

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
};
