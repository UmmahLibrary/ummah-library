"use client";

/**
 * Web `AudioStore` adapter (#202, ADR 0039): reciter audio saved for offline
 * playback via the **Cache API**. Each ayah is fetched once (everyayah sends
 * `Access-Control-Allow-Origin: *`, so the cross-origin blob is readable) and
 * stored under a synthetic same-origin key; playback reads it back as a blob
 * object URL — no service worker needed. The download *orchestration* is the
 * pure `downloadSurahAudio` in `@ummahlibrary/core`; this file is only storage.
 */
import type { AudioStore, DownloadedSurah, VerseKey } from "@ummahlibrary/core";

const CACHE = "ul-audio-v1";
const keyUrl = (reciterId: string, ref: VerseKey): string =>
  `/__audio/${reciterId}/${ref.sura}/${ref.aya}`;

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE);
  } catch {
    return null;
  }
}

export const webAudioStore: AudioStore = {
  async has(reciterId, ref) {
    const cache = await openCache();
    return cache ? (await cache.match(keyUrl(reciterId, ref))) !== undefined : false;
  },

  async localUrl(reciterId, ref) {
    const cache = await openCache();
    if (!cache) return null;
    const res = await cache.match(keyUrl(reciterId, ref));
    if (!res) return null;
    try {
      return URL.createObjectURL(await res.blob());
    } catch {
      return null;
    }
  },

  async save(reciterId, ref, remoteUrl) {
    const cache = await openCache();
    if (!cache) return;
    if (await cache.match(keyUrl(reciterId, ref))) return; // idempotent
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`audio fetch ${remoteUrl} -> ${res.status}`);
    const blob = await res.blob();
    // Re-wrap as a same-origin response so the blob (and its size) read back cleanly.
    await cache.put(
      keyUrl(reciterId, ref),
      new Response(blob, {
        headers: { "Content-Type": blob.type || "audio/mpeg", "Content-Length": String(blob.size) },
      }),
    );
  },

  async removeSurah(reciterId, surah) {
    const cache = await openCache();
    if (!cache) return;
    const prefix = `/__audio/${reciterId}/${surah}/`;
    for (const req of await cache.keys()) {
      if (new URL(req.url).pathname.startsWith(prefix)) await cache.delete(req);
    }
  },

  async savedSurahs() {
    const cache = await openCache();
    if (!cache) return [];
    const bySurah = new Map<string, DownloadedSurah>();
    for (const req of await cache.keys()) {
      const m = new URL(req.url).pathname.match(/^\/__audio\/([^/]+)\/(\d+)\/(\d+)$/);
      if (!m) continue;
      const [, reciterId, suraStr] = m;
      const id = `${reciterId}:${suraStr}`;
      const entry =
        bySurah.get(id) ?? { reciterId: reciterId!, surah: Number(suraStr), ayahCount: 0, bytes: 0 };
      entry.ayahCount += 1;
      const len = (await cache.match(req))?.headers.get("Content-Length");
      if (len) entry.bytes += Number(len);
      bySurah.set(id, entry);
    }
    return [...bySurah.values()].sort(
      (a, b) => a.reciterId.localeCompare(b.reciterId) || a.surah - b.surah,
    );
  },
};
