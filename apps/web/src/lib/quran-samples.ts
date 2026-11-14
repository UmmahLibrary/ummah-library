/**
 * The few āyāt the interface shows as samples (text-size preview, first-run
 * setup, Kids mode). Copied verbatim from the bundled datasets — Tanzil Uthmani
 * (CC-BY 3.0) and The Clear Quran (Mustafa Khattab) — and a test asserts they
 * still match the datasets character for character, so a sample can never drift
 * from the real text or lose a ḥaraka.
 */
export interface QuranSample {
  sura: number;
  aya: number;
  arabic: string;
  english: string;
}

export const QURAN_SAMPLES: readonly QuranSample[] = [
  {
    sura: 1,
    aya: 2,
    arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    english: "All praise is for Allah—Lord of all worlds",
  },
  {
    sura: 112,
    aya: 1,
    arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    english: "Say, ˹O Prophet,˺ “He is Allah—One ˹and Indivisible˺",
  },
  {
    sura: 18,
    aya: 10,
    arabic:
      "إِذْ أَوَى ٱلْفِتْيَةُ إِلَى ٱلْكَهْفِ فَقَالُوا۟ رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    english:
      "˹Remember˺ when those youths took refuge in the cave, and said, “Our Lord! Grant us mercy from Yourself and guide us rightly through our ordeal.”",
  },
];

export const SAMPLE_FATIHA_2 = QURAN_SAMPLES[0]!;
export const SAMPLE_IKHLAS_1 = QURAN_SAMPLES[1]!;
export const SAMPLE_KAHF_10 = QURAN_SAMPLES[2]!;
