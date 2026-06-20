import type { Surah, Translation } from "@ummahlibrary/core";
import { BASE_URL } from "./config";
import { getCache, setCache } from "./storage";

/** A resolved verse for display: Arabic plus the chosen translation (if any). */
export interface VerseData {
  sura: number;
  aya: number;
  arabic: string;
  translation: string | null;
}

async function getJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * One ayah with an optional translation, from the public REST API
 * (`/api/v1/surahs/{s}/ayahs/{a}?edition=…`). Returns `null` on any failure so
 * the popup can show an offline/error state instead of throwing.
 */
export async function fetchVerse(
  sura: number,
  aya: number,
  edition: string,
): Promise<VerseData | null> {
  const data = (await getJson(
    `/api/v1/surahs/${sura}/ayahs/${aya}?edition=${encodeURIComponent(edition)}`,
  )) as { ayah?: { text?: string }; translation?: { text?: string } } | null;
  if (!data?.ayah?.text) return null;
  return { sura, aya, arabic: data.ayah.text, translation: data.translation?.text ?? null };
}

/** The 114-surah index, cached locally after the first fetch (it never changes). */
export async function getSurahs(): Promise<readonly Surah[]> {
  const cached = await getCache<readonly Surah[]>("surahs", []);
  if (cached.length === 114) return cached;
  const data = (await getJson("/api/v1/surahs")) as { surahs?: Surah[] } | null;
  const surahs = data?.surahs ?? [];
  if (surahs.length === 114) await setCache("surahs", surahs);
  return surahs;
}

/** Available translation editions, cached locally. Empty array on failure. */
export async function getEditions(): Promise<readonly Translation[]> {
  const cached = await getCache<readonly Translation[]>("editions", []);
  if (cached.length > 0) return cached;
  const data = (await getJson("/api/v1/editions")) as { editions?: Translation[] } | null;
  const editions = data?.editions ?? [];
  if (editions.length > 0) await setCache("editions", editions);
  return editions;
}
