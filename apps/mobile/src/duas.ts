/**
 * A small curated set of Qurʾānic duʿās for the Duʿās screen. All are direct
 * Qurʾānic supplications with their references, grouped by moment. This is
 * Islamic content — a release PR adding/altering it should carry
 * `needs-scholar-review` (see AGENTS.md).
 */
export interface Dua {
  ar: string;
  en: string;
  ref: string;
  category: string;
}

export const DUA_CATEGORIES = [
  "Comprehensive",
  "Forgiveness",
  "Guidance & knowledge",
  "Ease in hardship",
  "Trust & protection",
  "Gratitude & family",
] as const;

export const DUAS: Dua[] = [
  {
    ar: "رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْـَٔاخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ",
    en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    ref: "Al-Baqarah 2:201",
    category: "Comprehensive",
  },
  {
    ar: "رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا",
    en: "Our Lord, do not take us to task if we forget or fall into error.",
    ref: "Al-Baqarah 2:286",
    category: "Forgiveness",
  },
  {
    ar: "رَبَّنَا ٱغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِىٓ أَمْرِنَا",
    en: "Our Lord, forgive us our sins and our excesses in our affairs.",
    ref: "Āl ʿImrān 3:147",
    category: "Forgiveness",
  },
  {
    ar: "رَّبِّ زِدْنِى عِلْمًا",
    en: "My Lord, increase me in knowledge.",
    ref: "Ṭā-Hā 20:114",
    category: "Guidance & knowledge",
  },
  {
    ar: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا",
    en: "Our Lord, let not our hearts deviate after You have guided us.",
    ref: "Āl ʿImrān 3:8",
    category: "Guidance & knowledge",
  },
  {
    ar: "رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى",
    en: "My Lord, expand for me my breast and ease for me my task.",
    ref: "Ṭā-Hā 20:25–26",
    category: "Ease in hardship",
  },
  {
    ar: "حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",
    en: "Allah is sufficient for us, and He is the best disposer of affairs.",
    ref: "Āl ʿImrān 3:173",
    category: "Trust & protection",
  },
  {
    ar: "رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ ٱلْمَصِيرُ",
    en: "Our Lord, upon You we rely, to You we turn, and to You is the destination.",
    ref: "Al-Mumtaḥanah 60:4",
    category: "Trust & protection",
  },
  {
    ar: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّـٰتِنَا قُرَّةَ أَعْيُنٍ",
    en: "Our Lord, grant us from among our spouses and offspring comfort to our eyes.",
    ref: "Al-Furqān 25:74",
    category: "Gratitude & family",
  },
  {
    ar: "رَبِّ أَوْزِعْنِىٓ أَنْ أَشْكُرَ نِعْمَتَكَ ٱلَّتِىٓ أَنْعَمْتَ عَلَىَّ",
    en: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
    ref: "An-Naml 27:19",
    category: "Gratitude & family",
  },
];

export function duaOfToday(now = new Date()): Dua {
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return DUAS[dayOfYear % DUAS.length]!;
}
