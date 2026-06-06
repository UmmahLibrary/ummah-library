/**
 * Thin client over the public REST API (ADR 0004). The mobile app is
 * online-first (ADR 0009): every screen reads through these helpers. Responses
 * map onto the shared `core` entities so types stay honest end to end.
 */
import type {
  Ayah,
  HadithSection,
  Surah,
  TafsirEntry,
  TranslatedAyah,
  Translation,
} from "@ummahlibrary/core";

const BASE = "https://app.ummahlibrary.org/api/v1";

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
  getTafsir: (n: number, edition: string) =>
    getJson<{ entries: TafsirEntry[] }>(`${BASE}/surahs/${n}/tafsirs/${edition}`).then(
      (d) => d.entries,
    ),
  getHadithSection: (collection: string, section: number) =>
    getJson<HadithSection>(`${BASE}/hadith/${collection}/sections/${section}`),
};
