/**
 * Mobile `AudioStore` adapter (#202 mobile follow-up, ADR 0039): reciter audio
 * saved for offline playback via `expo-file-system`. Each ayah is downloaded once
 * to `<document dir>/ul-audio/{reciterId}/{surah}/{aya}.mp3` and handed back as a
 * `file://` URI — no Cache API on this platform, just files under the app's own
 * document directory (persistent user data, not OS-reclaimable, unlike
 * `offlineCache.ts`'s disposable `Paths.cache`). The download *orchestration* is
 * the pure `downloadSurahAudio` in `@ummahlibrary/core`; this file is only
 * storage, mirroring `apps/web/src/lib/audio-store.ts`.
 */
import { Directory, File, Paths } from "expo-file-system";
import type { AudioStore, DownloadedSurah, VerseKey } from "@ummahlibrary/core";

const AUDIO_DIR_NAME = "ul-audio";

function audioRoot(): Directory {
  return new Directory(Paths.document, AUDIO_DIR_NAME);
}

function surahDir(reciterId: string, surah: number): Directory {
  return new Directory(audioRoot(), reciterId, String(surah));
}

function ayahFile(reciterId: string, ref: VerseKey): File {
  return new File(surahDir(reciterId, ref.sura), `${ref.aya}.mp3`);
}

/** The final path segment of a File/Directory's uri, decoded — its "name". */
function nameOf(entry: File | Directory): string {
  const uri = entry.uri.replace(/\/$/, "");
  return decodeURIComponent(uri.slice(uri.lastIndexOf("/") + 1));
}

export const mobileAudioStore: AudioStore = {
  async has(reciterId, ref) {
    return ayahFile(reciterId, ref).exists;
  },

  async localUrl(reciterId, ref) {
    const file = ayahFile(reciterId, ref);
    return file.exists ? file.uri : null;
  },

  async save(reciterId, ref, remoteUrl) {
    const dest = ayahFile(reciterId, ref);
    if (dest.exists) return; // idempotent
    const dir = surahDir(reciterId, ref.sura);
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    await File.downloadFileAsync(remoteUrl, dest, { idempotent: true });
  },

  async removeSurah(reciterId, surah) {
    const dir = surahDir(reciterId, surah);
    if (dir.exists) dir.delete();
  },

  async savedSurahs() {
    const root = audioRoot();
    if (!root.exists) return [];
    const result: DownloadedSurah[] = [];
    for (const reciterEntry of root.list()) {
      if (!(reciterEntry instanceof Directory)) continue;
      const reciterId = nameOf(reciterEntry);
      for (const surahEntry of reciterEntry.list()) {
        if (!(surahEntry instanceof Directory)) continue;
        const surah = Number(nameOf(surahEntry));
        if (!Number.isInteger(surah) || surah < 1) continue;
        const files = surahEntry.list().filter((e): e is File => e instanceof File);
        if (files.length === 0) continue;
        const bytes = files.reduce((n, f) => n + (f.size ?? 0), 0);
        result.push({ reciterId, surah, ayahCount: files.length, bytes });
      }
    }
    return result.sort((a, b) => a.reciterId.localeCompare(b.reciterId) || a.surah - b.surah);
  },
};
