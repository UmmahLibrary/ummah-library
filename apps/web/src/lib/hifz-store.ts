"use client";

import { type HifzCard, type VerseKey, compareVerseKeys, isDue } from "@ummahlibrary/core";

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
