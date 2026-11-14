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
  // Five destinations (ADR 0041)
  "nav.today": "Today",
  "nav.prayer": "Prayer",
  "nav.more": "More",
  "nav.allSurahs": "All surahs",
  "nav.listen": "Listen",
  "nav.mosques": "Nearby mosques",
  "nav.kids": "For children",
  "nav.blog": "Articles",
  "nav.settings": "Settings",
  "nav.downloads": "Downloads",
  "nav.profile": "Your journey",
  // Hub tile notes
  "note.allSurahs": "Browse by surah or juz",
  "note.search": "Find any āyah",
  "note.listen": "Recitation with translation",
  "note.hifz": "Memorise and review",
  "note.plans": "Read the whole Quran",
  "note.goals": "Your daily portion",
  "note.bookmarks": "Āyāt you saved",
  "note.tafsir": "Explanations of the āyāt",
  "note.prayerTimes": "Today's ṣalāh times",
  "note.tracker": "Keep track of your prayers",
  "note.qibla": "Direction to Makkah",
  "note.ramadan": "Suḥūr and ifṭār",
  "note.mosques": "Find a place to pray",
  "note.duas": "From the Quran and Sunnah",
  "note.adhkar": "Morning and evening",
  "note.hadith": "The six collections",
  "note.names": "Al-Asmāʾ al-Ḥusnā",
  "note.kids": "Short surahs, big buttons",
  "note.blog": "Guides and news",
  "note.settings": "Language, text size, theme",
  "note.tasbih": "Dhikr counter",
  "note.calendar": "Islamic dates",
  "note.zakat": "Work out your zakāt",
  "note.downloads": "Audio for offline",
  "note.profile": "Your reading so far",
  // Common chrome
  "common.settings": "Settings",
  "common.language": "Language",
  "settings.languageHint":
    "Choose the language for the app's interface. Quran and translation text are unaffected.",
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
  "nav.today": "آج",
  "nav.prayer": "نماز",
  "nav.more": "مزید",
  "nav.allSurahs": "تمام سورتیں",
  "nav.listen": "سنیں",
  "nav.mosques": "قریبی مساجد",
  "nav.kids": "بچوں کے لیے",
  "nav.blog": "مضامین",
  "nav.settings": "ترتیبات",
  "nav.downloads": "ڈاؤن لوڈز",
  "nav.profile": "آپ کا سفر",
  "note.allSurahs": "سورت یا پارے کے لحاظ سے دیکھیں",
  "note.search": "کوئی بھی آیت تلاش کریں",
  "note.listen": "ترجمے کے ساتھ تلاوت",
  "note.hifz": "حفظ اور دہرائی",
  "note.plans": "پورا قرآن پڑھیں",
  "note.goals": "آپ کا روزانہ حصہ",
  "note.bookmarks": "محفوظ کی گئی آیات",
  "note.tafsir": "آیات کی وضاحت",
  "note.prayerTimes": "آج کے نماز کے اوقات",
  "note.tracker": "اپنی نمازوں کا حساب رکھیں",
  "note.qibla": "مکہ کی سمت",
  "note.ramadan": "سحری اور افطار",
  "note.mosques": "نماز کی جگہ تلاش کریں",
  "note.duas": "قرآن و سنت سے",
  "note.adhkar": "صبح و شام",
  "note.hadith": "چھ مجموعے",
  "note.names": "الاسماء الحسنیٰ",
  "note.kids": "چھوٹی سورتیں، بڑے بٹن",
  "note.blog": "رہنمائی اور خبریں",
  "note.settings": "زبان، متن کا سائز، تھیم",
  "note.tasbih": "ذکر کاؤنٹر",
  "note.calendar": "اسلامی تاریخیں",
  "note.zakat": "اپنی زکوٰۃ کا حساب",
  "note.downloads": "آف لائن آڈیو",
  "note.profile": "اب تک آپ کا مطالعہ",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
  "settings.languageHint":
    "ایپ کے انٹرفیس کی زبان منتخب کریں۔ قرآن اور ترجمے کا متن متاثر نہیں ہوگا۔",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
