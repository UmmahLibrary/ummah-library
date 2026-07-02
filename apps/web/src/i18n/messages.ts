/**
 * UI message catalogue (#208). English is the source of truth and defines the
 * key set; every other locale is a `Record<MessageKey, string>` the compiler
 * forces to stay complete. This is a **starter slice** (the app shell / nav +
 * common chrome) that proves the mechanism end-to-end; extraction of the rest of
 * the UI is incremental follow-up.
 *
 * The Urdu strings are a first pass and are flagged for **native review** before
 * release — the localization *infrastructure* is what this change lands, not
 * authoritative translations.
 */
import type { Locale } from "./config";

export const en = {
  // Nav — section headings
  "nav.read": "Read",
  "nav.memorize": "Memorize",
  "nav.worship": "Worship",
  "nav.learn": "Learn",
  // Nav — items
  "nav.quran": "Quran",
  "nav.search": "Search",
  "nav.plans": "Reading Plans",
  "nav.bookmarks": "Bookmarks",
  "nav.tafsir": "Tafsir",
  "nav.hifz": "Hifz Review",
  "nav.goals": "Reading Goals",
  "nav.prayerTimes": "Prayer Times",
  "nav.tracker": "Prayer Tracker",
  "nav.ramadan": "Ramadan",
  "nav.duas": "Duʿās",
  "nav.qibla": "Qibla",
  "nav.adhkar": "Adhkār",
  "nav.tasbih": "Tasbih",
  "nav.hadith": "Hadith",
  "nav.names": "99 Names",
  "nav.calendar": "Hijri Calendar",
  "nav.zakat": "Zakat",
  // Common chrome
  "common.settings": "Settings",
  "common.language": "Language",
  "settings.languageHint": "Choose the language for the app's interface. Quran and translation text are unaffected.",
} as const;

export type MessageKey = keyof typeof en;

// First-pass Urdu (RTL) — نظرِ ثانی درکار / needs native review.
const ur: Record<MessageKey, string> = {
  "nav.read": "پڑھیں",
  "nav.memorize": "حفظ",
  "nav.worship": "عبادت",
  "nav.learn": "سیکھیں",
  "nav.quran": "قرآن",
  "nav.search": "تلاش",
  "nav.plans": "مطالعہ منصوبے",
  "nav.bookmarks": "محفوظات",
  "nav.tafsir": "تفسیر",
  "nav.hifz": "حفظ کا جائزہ",
  "nav.goals": "مطالعہ اہداف",
  "nav.prayerTimes": "نماز کے اوقات",
  "nav.tracker": "نماز ٹریکر",
  "nav.ramadan": "رمضان",
  "nav.duas": "دعائیں",
  "nav.qibla": "قبلہ",
  "nav.adhkar": "اذکار",
  "nav.tasbih": "تسبیح",
  "nav.hadith": "حدیث",
  "nav.names": "اللہ کے ۹۹ نام",
  "nav.calendar": "ہجری کیلنڈر",
  "nav.zakat": "زکوٰۃ",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
  "settings.languageHint": "ایپ کے انٹرفیس کی زبان منتخب کریں۔ قرآن اور ترجمے کا متن متاثر نہیں ہوگا۔",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
