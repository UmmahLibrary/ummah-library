"use client";

import { type HifzCard, type VerseKey, compareVerseKeys, isDue } from "@ummahlibrary/core";

/** 0 = new/never reviewed · 1 = solidly known (interval ≥ 30 days). */
export function cardStrength(card: HifzCard): number {
  if (card.lastReviewed === null) return 0;
  return Math.min(1, card.intervalDays / 30);
}

export interface SurahProgress {
  surahNumber: number;
  trackedCount: number;
  dueCount: number;
  avgStrength: number; // 0–1
  nextDue: string | null; // earliest due ISO timestamp among tracked cards
}

/** Aggregate per-ayah records into per-surah summaries. */
export function surahProgressMap(now: Date): Map<number, SurahProgress> {
  const map = new Map<number, SurahProgress>();
  for (const r of allRecords()) {
    const sura = r.ref.sura;
    const p = map.get(sura) ?? {
      surahNumber: sura,
      trackedCount: 0,
      dueCount: 0,
      avgStrength: 0,
      nextDue: null,
    };
    p.trackedCount++;
    p.avgStrength += cardStrength(r.card);
    if (isDue(r.card, now)) p.dueCount++;
    if (!p.nextDue || r.card.due < p.nextDue) p.nextDue = r.card.due;
    map.set(sura, p);
  }
  for (const [sura, p] of map) {
    p.avgStrength = p.trackedCount > 0 ? p.avgStrength / p.trackedCount : 0;
    map.set(sura, p);
  }
  return map;
}

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
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
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
