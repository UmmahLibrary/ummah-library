/** Small display helpers shared across screens. */

/** Render a Latin number with Arabic-Indic digits, e.g. 255 → "٢٥٥". */
export const toArabicDigits = (n: number): string =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

/** The Basmala, shown as a header above every surah but At-Tawbah. */
export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
