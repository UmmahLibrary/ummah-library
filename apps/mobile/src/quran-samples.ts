/**
 * The āyah the interface shows as a text-size sample. Copied verbatim from the
 * bundled datasets — Tanzil Uthmani (CC-BY 3.0) and The Clear Quran (Mustafa
 * Khattab) — and `quran-samples.test.ts` asserts it still matches them code
 * point for code point (never NFC-normalized), same as web's samples.
 */
export const SAMPLE_FATIHA_2 = {
  sura: 1,
  aya: 2,
  arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
  english: "All praise is for Allah—Lord of all worlds",
} as const;
