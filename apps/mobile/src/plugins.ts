/**
 * Content-plugin manifests the mobile app needs but can't load from `data`
 * (mobile depends only on `core`). These mirror the JSON manifests in
 * packages/data/plugins/. When any of these lists needs to grow, expose it via
 * the public REST API (like `/editions`) instead of expanding the constants.
 */
import type { ReciterPlugin } from "@ummahlibrary/core";

/** Mirrors packages/data/plugins/reciters/alafasy.json. */
export const RECITER: ReciterPlugin = {
  kind: "reciter",
  id: "alafasy",
  name: "Mishary Rashid Alafasy",
  language: "ar",
  style: "Murattal",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
  quranComId: 7,
};

export const RECITERS: ReciterPlugin[] = [RECITER];

/** Mirrors packages/data/plugins/tafsirs/. */
export const TAFSIRS = [{ id: "en-ibn-kathir", name: "Tafsir Ibn Kathir (abridged)" }] as const;

/** Mirrors packages/data/plugins/hadiths/. */
export const HADITH_COLLECTIONS = [
  { id: "eng-bukhari", name: "Sahih al-Bukhari" },
  { id: "eng-muslim", name: "Sahih Muslim" },
] as const;
