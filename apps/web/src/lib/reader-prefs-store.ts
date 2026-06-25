/**
 * Web reader-UI preferences (ADR 0024) — the raw-storage home for small
 * per-reader display state: the last-read surah, the word-by-word toggle, the
 * audio loop, and per-page scroll position. Kept **synchronous** (these are read
 * during render / scroll restore, before paint), so components import these
 * helpers instead of touching `localStorage` / `sessionStorage` directly. This
 * `*-store` file is the sanctioned raw-storage home.
 */
import { clampPlaybackRate } from "@ummahlibrary/core";

const LAST_READ_KEY = "ul.lastRead";
const LOOP_KEY = "ul.loop";
const RATE_KEY = "ul.audioRate";
// Mirrors the event key exported by components/WordByWord.
const WBW_KEY = "ul.wbw";

/** The last-read position: the surah, the furthest āyah reached, and that
 *  surah's āyah count at write time (so the home card can show progress). */
export interface LastRead {
  surah: number;
  aya?: number;
  total?: number;
}

/** Parse the stored last-read record, tolerating corrupt / peer-synced values.
 *  Read during render/scroll-restore: a corrupt null would crash on `.surah`;
 *  a non-number surah must not flow through as a bogus value. */
function parseLastRead(): LastRead | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (v === null || typeof v !== "object") return null;
    const o = v as { surah?: unknown; aya?: unknown; total?: unknown };
    if (typeof o.surah !== "number") return null;
    const rec: LastRead = { surah: o.surah };
    if (typeof o.aya === "number") rec.aya = o.aya;
    if (typeof o.total === "number") rec.total = o.total;
    return rec;
  } catch {
    return null;
  }
}

/** The surah number the reader last opened, or `null`. */
export function readLastRead(): number | null {
  return parseLastRead()?.surah ?? null;
}

/** The full last-read position (surah + āyah + total), or `null`. */
export function readLastReadFull(): LastRead | null {
  return parseLastRead();
}

/**
 * Record the last-read position. The reader writes the surah on mount and then
 * `(surah, aya, total)` as it scrolls. A surah-only write preserves any āyah
 * already stored for that same surah, so re-opening a surah doesn't reset the
 * spot before the first scroll refines it.
 */
export function writeLastRead(surah: number, aya?: number, total?: number): void {
  try {
    let rec: LastRead = { surah };
    if (typeof aya === "number") {
      rec.aya = aya;
      if (typeof total === "number") rec.total = total;
    } else {
      const prev = parseLastRead();
      if (prev && prev.surah === surah) rec = prev;
    }
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(rec));
  } catch {
    /* storage unavailable */
  }
}

export function readWordByWord(): boolean {
  try {
    return localStorage.getItem(WBW_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeWordByWord(on: boolean): void {
  try {
    localStorage.setItem(WBW_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

export function readLoop(): boolean {
  try {
    return localStorage.getItem(LOOP_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLoop(on: boolean): void {
  try {
    localStorage.setItem(LOOP_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

/** The remembered playback speed (clamped); defaults to `1` (normal). */
export function readRate(): number {
  try {
    const raw = Number(localStorage.getItem(RATE_KEY));
    return clampPlaybackRate(raw || 1);
  } catch {
    return 1;
  }
}

export function writeRate(rate: number): void {
  try {
    localStorage.setItem(RATE_KEY, String(clampPlaybackRate(rate)));
  } catch {
    /* storage unavailable */
  }
}

/** Per-page scroll offset (session-scoped — restores within a tab session). */
export function readScroll(key: string): number {
  try {
    return Number(sessionStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function writeScroll(key: string, y: number): void {
  try {
    sessionStorage.setItem(key, String(y));
  } catch {
    /* storage unavailable */
  }
}
