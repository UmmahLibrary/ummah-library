/**
 * "Go to" — one input that understands every way people name a place in the
 * Quran: `2:255`, `2 255`, `255` (within the current surah), `baqarah 255`,
 * `البقرة`, Arabic-Indic / Persian digits, `juz 15` (also `para` / `sipara`, as
 * South Asian readers say), `page 300`, `hizb 30`. Pure and deterministic: the
 * caller passes the surah names (core imports no data) and gets back a target
 * verse it can scroll or navigate to.
 */
import {
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  PAGE_STARTS,
  TOTAL_HIZB,
  TOTAL_JUZ,
  TOTAL_PAGES_MADANI,
  TOTAL_SURAHS,
} from "./quran-structure";

export interface GoToSurahName {
  number: number;
  /** Arabic name, e.g. "البقرة". */
  name: string;
  /** Latin transliteration, e.g. "Al-Baqara". */
  transliteration: string;
  /** English meaning, e.g. "The Cow". */
  englishName: string;
}

export type GoToKind = "ayah" | "surah" | "juz" | "hizb" | "page";

export interface GoToTarget {
  kind: GoToKind;
  /** Surah of the verse to open. */
  sura: number;
  /** Verse to open (1 when the target is a whole surah). */
  aya: number;
  /** The juz / hizb / page number when `kind` is one of those. */
  n?: number;
}

export interface GoToContext {
  /** The surah currently open, so a bare number means an āyah in it. */
  currentSurah?: number;
}

/** Western digits for Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) input. */
export function toWesternDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Fold a Latin surah name to a loose key so "Al-Baqarah", "baqara", "Baqarah",
 * "al baqra" all meet: lowercase, strip the article and punctuation, collapse
 * doubled vowels and common transliteration variants.
 */
export function foldLatinName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ā → a, ṣ → s
    .replace(/[ʿʾ'’`‘]/g, "")
    .replace(/^(al|an|ar|as|at|ad|adh|ash|az|aal)[\s-]+/, "")
    .replace(/[^a-z]/g, "")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/(.)\1+/g, "$1")
    .replace(/h$/, "");
}

/** Fold an Arabic name: drop ḥarakāt and tatweel, unify alef/hamza/yā/tā forms. */
export function foldArabicName(input: string): string {
  return input
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/^ال/, "")
    .replace(/\s+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

/**
 * Surahs whose name matches `query`, best first. Exact and prefix matches rank
 * above a small typo distance (≤ 1 for short names, ≤ 2 for longer ones).
 */
export function matchSurahNames(query: string, names: readonly GoToSurahName[]): GoToSurahName[] {
  const q = query.trim();
  if (!q) return [];
  const isArabic = /[؀-ۿ]/.test(q);
  const key = isArabic ? foldArabicName(q) : foldLatinName(q);
  if (!key) return [];
  const scored: { s: GoToSurahName; score: number }[] = [];
  for (const s of names) {
    const keys = isArabic
      ? [foldArabicName(s.name)]
      : [foldLatinName(s.transliteration), foldLatinName(s.englishName)];
    let best = Infinity;
    for (const k of keys) {
      if (!k) continue;
      if (k === key) best = Math.min(best, 0);
      else if (k.startsWith(key)) best = Math.min(best, 1);
      else if (key.length >= 3 && k.includes(key)) best = Math.min(best, 2);
      else {
        const d = levenshtein(k, key);
        const allowed = key.length <= 4 ? 1 : 2;
        if (d <= allowed) best = Math.min(best, 2 + d);
      }
    }
    if (best < Infinity) scored.push({ s, score: best });
  }
  return scored.sort((a, b) => a.score - b.score || a.s.number - b.s.number).map((x) => x.s);
}

function ayahTarget(sura: number, aya: number): GoToTarget | null {
  if (!Number.isInteger(sura) || sura < 1 || sura > TOTAL_SURAHS) return null;
  const count = AYAH_COUNTS[sura - 1]!;
  if (!Number.isInteger(aya) || aya < 1 || aya > count) return null;
  return { kind: "ayah", sura, aya };
}

const UNIT =
  /^(juz|juzz|jz|j|para|parah|sipara|siparah|paara|page|pg|p|hizb|hizab|h|surah|sura|surat|s)\s*\.?\s*(\d{1,3})$/;

/**
 * Parse a Go-to query into a verse target, or `null` if it doesn't name a real
 * place (out-of-range numbers are rejected, never clamped).
 */
export function parseGoTo(
  raw: string,
  names: readonly GoToSurahName[],
  ctx: GoToContext = {},
): GoToTarget | null {
  const input = toWesternDigits(raw).trim().toLowerCase().replace(/\s+/g, " ");
  if (!input) return null;

  // 2:255 · 2 255 · 2.255 · 2/255 · 2-255
  let m = /^(\d{1,3})\s*[:. /\-،]\s*(\d{1,3})$/.exec(input);
  if (m) return ayahTarget(Number(m[1]), Number(m[2]));

  // juz 15 · j15 · para 15 · page 300 · p300 · hizb 30 · surah 18
  m = UNIT.exec(input);
  if (m) {
    const unit = m[1]!;
    const n = Number(m[2]);
    if (/^(juz|juzz|jz|j|para|parah|sipara|siparah|paara)$/.test(unit)) {
      if (n < 1 || n > TOTAL_JUZ) return null;
      const { sura, aya } = JUZ_STARTS[n - 1]!;
      return { kind: "juz", sura, aya, n };
    }
    if (/^(page|pg|p)$/.test(unit)) {
      if (n < 1 || n > TOTAL_PAGES_MADANI) return null;
      const { sura, aya } = PAGE_STARTS[n - 1]!;
      return { kind: "page", sura, aya, n };
    }
    if (/^(hizb|hizab|h)$/.test(unit)) {
      if (n < 1 || n > TOTAL_HIZB) return null;
      const { sura, aya } = HIZB_STARTS[n - 1]!;
      return { kind: "hizb", sura, aya, n };
    }
    if (n < 1 || n > TOTAL_SURAHS) return null;
    return { kind: "surah", sura: n, aya: 1 };
  }

  // A bare number: an āyah in the open surah, otherwise a surah number.
  m = /^(\d{1,3})$/.exec(input);
  if (m) {
    const n = Number(m[1]);
    if (ctx.currentSurah) return ayahTarget(ctx.currentSurah, n);
    if (n < 1 || n > TOTAL_SURAHS) return null;
    return { kind: "surah", sura: n, aya: 1 };
  }

  // A name, optionally followed by an āyah: "baqarah 255", "kahf", "البقرة ٢٥٥"
  m = /^(.*?)[\s:]*(\d{1,3})?$/.exec(input);
  const namePart = (m?.[1] ?? "").trim();
  const ayaPart = m?.[2];
  const match = matchSurahNames(namePart, names)[0];
  if (!match) return null;
  if (ayaPart) return ayahTarget(match.number, Number(ayaPart));
  return { kind: "surah", sura: match.number, aya: 1 };
}

/** Human-readable label for a target, e.g. "Al-Baqara · Āyah 255". */
export function describeGoTo(target: GoToTarget, names: readonly GoToSurahName[]): string {
  const surah = names.find((s) => s.number === target.sura);
  const name = surah?.transliteration ?? `Surah ${target.sura}`;
  switch (target.kind) {
    case "ayah":
      return `${name} · Āyah ${target.aya}`;
    case "surah":
      return name;
    case "juz":
      return `Juz ${target.n} · starts at ${name} ${target.sura}:${target.aya}`;
    case "hizb":
      return `Hizb ${target.n} · starts at ${name} ${target.sura}:${target.aya}`;
    case "page":
      return `Page ${target.n} · starts at ${name} ${target.sura}:${target.aya}`;
  }
}
