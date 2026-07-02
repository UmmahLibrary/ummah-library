"use client";

import { type HifzCard, type VerseKey, compareVerseKeys, isDue } from "@ummahlibrary/core";

// Strength + per-surah progress derivations are pure logic; they live in core
// (shared with mobile) and are re-exported here so existing web imports keep
// their path. `surahProgressMap(records, now)` — pass `allRecords()`.
export { cardStrength, surahProgressMap, weakestSurahs, type SurahProgress } from "@ummahlibrary/core";

const KEY = "ul.hifz";

type Store = Record<string, HifzCard>;
const keyOf = (ref: VerseKey): string => `${ref.sura}:${ref.aya}`;
const parseKey = (key: string): VerseKey => {
  const [sura, aya] = key.split(":").map(Number);
  return { sura: sura!, aya: aya! };
};

export interface HifzRecord {
  ref: VerseKey;
  card: HifzCard;
}

function read(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    // Must be a plain object map: a corrupt or peer-synced null / array / scalar
    // would crash Object.entries / `in` / indexing in the consumers below.
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function getCard(ref: VerseKey): HifzCard | null {
  return read()[keyOf(ref)] ?? null;
}

export function setCard(ref: VerseKey, card: HifzCard): void {
  const store = read();
  store[keyOf(ref)] = card;
  write(store);
}

export function removeCard(ref: VerseKey): void {
  const store = read();
  delete store[keyOf(ref)];
  write(store);
}

export function isTracked(ref: VerseKey): boolean {
  return keyOf(ref) in read();
}

export function allRecords(): HifzRecord[] {
  return Object.entries(read())
    .map(([key, card]) => ({ ref: parseKey(key), card }))
    .sort((a, b) => compareVerseKeys(a.ref, b.ref));
}

export function dueRecords(now: Date): HifzRecord[] {
  return allRecords().filter((r) => isDue(r.card, now));
}
