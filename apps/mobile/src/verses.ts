/** A small curated set of āyāt rotated daily for "Verse of the day". */
export const VERSES: { ar: string; en: string; ref: string }[] = [
  {
    ar: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    en: "…Unquestionably, by the remembrance of Allah hearts are assured.",
    ref: "Ar-Raʿd 13:28",
  },
  {
    ar: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    en: "For indeed, with hardship comes ease.",
    ref: "Ash-Sharḥ 94:5",
  },
  {
    ar: "وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا",
    en: "And whoever is mindful of Allah, He will make for them a way out.",
    ref: "Aṭ-Ṭalāq 65:2",
  },
  {
    ar: "وَقُل رَّبِّ زِدْنِى عِلْمًا",
    en: "And say, “My Lord, increase me in knowledge.”",
    ref: "Ṭā-Hā 20:114",
  },
  {
    ar: "إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    en: "Indeed, Allah is with the patient.",
    ref: "Al-Baqara 2:153",
  },
];

export function verseOfToday(now = new Date()) {
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return VERSES[dayOfYear % VERSES.length]!;
}
