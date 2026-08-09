import { describe, expect, it } from "vitest";
import { PLAYBACK_SPEEDS, clampPlaybackRate, cyclePlaybackRate, repeatRange } from "./audio";

describe("clampPlaybackRate", () => {
  it("passes through an in-band rate", () => {
    expect(clampPlaybackRate(1.25)).toBe(1.25);
  });
  it("clamps to the [0.5, 2] band", () => {
    expect(clampPlaybackRate(0.1)).toBe(0.5);
    expect(clampPlaybackRate(5)).toBe(2);
  });
  it("falls back to 1 for a non-finite rate", () => {
    expect(clampPlaybackRate(Number.NaN)).toBe(1);
    expect(clampPlaybackRate(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("cyclePlaybackRate", () => {
  it("advances through every step and wraps to the start", () => {
    let rate: number = PLAYBACK_SPEEDS[0]!;
    const seen: number[] = [rate];
    for (let i = 0; i < PLAYBACK_SPEEDS.length; i++) {
      rate = cyclePlaybackRate(rate);
      seen.push(rate);
    }
    expect(seen.slice(0, PLAYBACK_SPEEDS.length)).toEqual([...PLAYBACK_SPEEDS]);
    expect(rate).toBe(PLAYBACK_SPEEDS[0]); // wrapped back to the first
  });
  it("jumps to the first step from an off-grid rate", () => {
    expect(cyclePlaybackRate(1.1)).toBe(PLAYBACK_SPEEDS[0]);
  });
});

describe("repeatRange", () => {
  const verses = [
    { sura: 2, aya: 1 },
    { sura: 2, aya: 2 },
    { sura: 2, aya: 3 },
    { sura: 2, aya: 4 },
  ];
  it("returns the inclusive A→B slice", () => {
    expect(repeatRange(verses, "2:2", "2:3")).toEqual([
      { sura: 2, aya: 2 },
      { sura: 2, aya: 3 },
    ]);
  });
  it("normalizes a reversed selection", () => {
    expect(repeatRange(verses, "2:3", "2:2")).toEqual([
      { sura: 2, aya: 2 },
      { sura: 2, aya: 3 },
    ]);
  });
  it("returns the whole list when a bound is missing or absent", () => {
    expect(repeatRange(verses, null, "2:3")).toHaveLength(4);
    expect(repeatRange(verses, "2:1", undefined)).toHaveLength(4);
    expect(repeatRange(verses, "2:1", "9:9")).toHaveLength(4);
  });
  it("a single-ayah range is just that ayah", () => {
    expect(repeatRange(verses, "2:3", "2:3")).toEqual([{ sura: 2, aya: 3 }]);
  });
});

import { downloadSurahAudio, isSurahDownloaded } from "./audio";
import type { AudioStore, DownloadedSurah } from "./ports";
import type { ReciterPlugin } from "./plugins";

function fakeAudioStore() {
  const saved = new Map<string, string>(); // key → remote url used
  const key = (r: string, ref: { sura: number; aya: number }) => `${r}:${ref.sura}:${ref.aya}`;
  let saveCalls = 0;
  const store: AudioStore = {
    has: async (r, ref) => saved.has(key(r, ref)),
    localUrl: async (r, ref) => (saved.has(key(r, ref)) ? `blob:${key(r, ref)}` : null),
    save: async (r, ref, remoteUrl) => {
      saveCalls++;
      saved.set(key(r, ref), remoteUrl);
    },
    removeSurah: async (r, surah) => {
      for (const k of [...saved.keys()]) if (k.startsWith(`${r}:${surah}:`)) saved.delete(k);
    },
    savedSurahs: async () => {
      const bySurah = new Map<string, DownloadedSurah>();
      for (const k of saved.keys()) {
        const [r, s] = k.split(":");
        const id = `${r}:${s}`;
        const e = bySurah.get(id) ?? { reciterId: r!, surah: Number(s), ayahCount: 0, bytes: 0 };
        e.ayahCount++;
        bySurah.set(id, e);
      }
      return [...bySurah.values()];
    },
  };
  return { store, saved, saveCalls: () => saveCalls };
}

const reciter = {
  kind: "reciter",
  id: "alafasy",
  name: "Alafasy",
  language: "ar",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
} as ReciterPlugin;

describe("downloadSurahAudio", () => {
  it("saves every ayah of the surah and reports progress to the end", async () => {
    const { store, saved } = fakeAudioStore();
    const progress: number[] = [];
    await downloadSurahAudio(store, reciter, 114, { onProgress: (p) => progress.push(p.done) });
    expect(saved.size).toBe(6); // An-Nās has 6 ayahs
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
    expect(saved.get("alafasy:114:1")).toBe("https://everyayah.com/data/Alafasy_128kbps/114001.mp3");
  });

  it("is idempotent — a second run re-fetches nothing", async () => {
    const { store, saveCalls } = fakeAudioStore();
    await downloadSurahAudio(store, reciter, 114);
    expect(saveCalls()).toBe(6);
    await downloadSurahAudio(store, reciter, 114);
    expect(saveCalls()).toBe(6); // all already present → no new saves
  });

  it("stops early when cancelled", async () => {
    const { store, saved } = fakeAudioStore();
    let done = 0;
    await downloadSurahAudio(store, reciter, 114, {
      onProgress: () => (done += 1),
      cancelled: () => done >= 3, // cancel after 3 progress ticks
    });
    expect(saved.size).toBe(3);
  });
});

describe("isSurahDownloaded", () => {
  it("is false until every ayah is saved, then true", async () => {
    const { store } = fakeAudioStore();
    expect(await isSurahDownloaded(store, "alafasy", 114)).toBe(false);
    await downloadSurahAudio(store, reciter, 114);
    expect(await isSurahDownloaded(store, "alafasy", 114)).toBe(true);
  });
});
