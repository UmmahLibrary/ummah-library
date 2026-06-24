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

/** The surah number the reader last opened, or `null`. */
export function readLastRead(): number | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    // Read during render/scroll-restore: a corrupt/peer-synced null would crash on
    // `.surah`; a non-number surah must not flow through as a bogus value.
    const v = JSON.parse(raw) as unknown;
    const surah =
      v !== null && typeof v === "object" ? (v as { surah?: unknown }).surah : undefined;
    return typeof surah === "number" ? surah : null;
  } catch {
    return null;
  }
}

export function writeLastRead(surah: number): void {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ surah }));
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
