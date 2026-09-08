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
  "nav.mosques": "Nearby Mosques",
  "nav.downloads": "Downloads",
  // Bottom tab bar (mobile shell)
  "tab.home": "Home",
  "tab.read": "Read",
  "tab.tools": "Tools",
  "tab.memorize": "Memorize",
  "tab.more": "More",
  "tab.moreLabel": "More — settings & tools",
  // Top bar
  "topbar.searchPlaceholder": "Search the Quran, a surah, or a tool…",
  "topbar.clearSearch": "Clear the search",
  "topbar.blog": "Blog",
  "topbar.blogTitle": "Read the blog",
  "topbar.profile": "Your journey",
  // Tools hub
  "tools.title": "Worship & Tools",
  "tools.subtitle": "Everything for your day, in one place.",
  "tools.all": "All tools",
  "tools.note.prayerTimes": "Daily salah times",
  "tools.note.ramadan": "Suḥūr & iftār times",
  "tools.note.tracker": "Log & build streaks",
  "tools.note.duas": "Fortress of the Muslim",
  "tools.note.plans": "Structured journeys",
  "tools.note.qibla": "Direction to Makkah",
  "tools.note.mosques": "Find a place to pray",
  "tools.note.hifz": "Spaced repetition",
  "tools.note.calendar": "Islamic dates",
  "tools.note.names": "Al-Asmāʾ al-Ḥusnā",
  "tools.note.tasbih": "Dhikr counter",
  "tools.note.adhkar": "Morning · Evening",
  "tools.note.zakat": "2.5% calculator",
  "tools.note.hadith": "Search the collections",
  "tools.note.downloads": "Offline reciter audio",
  // Tools hub — featured cards
  "tools.nextPrayer": "Next prayer",
  "tools.inTime": "in {time}",
  "tools.inTimeAt": "in {time} · {place}",
  "tools.prayerCardSub": "Daily salah · your location",
  "tools.viewPrayerTimes": "View prayer times",
  "tools.qiblaBearing": "Qibla · {degrees}° {point}",
  "tools.qiblaSub": "Direction to the Kaʿbah",
  "tools.qiblaNoLocation": "Set your location to see the direction",
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
  "nav.mosques": "قریبی مساجد",
  "nav.downloads": "ڈاؤن لوڈز",
  "tab.home": "ہوم",
  "tab.read": "پڑھیں",
  "tab.tools": "اوزار",
  "tab.memorize": "حفظ",
  "tab.more": "مزید",
  "tab.moreLabel": "مزید — ترتیبات اور اوزار",
  "topbar.searchPlaceholder": "قرآن، سورت یا کوئی اوزار تلاش کریں…",
  "topbar.clearSearch": "تلاش صاف کریں",
  "topbar.blog": "بلاگ",
  "topbar.blogTitle": "بلاگ پڑھیں",
  "topbar.profile": "آپ کا سفر",
  "tools.title": "عبادت اور اوزار",
  "tools.subtitle": "آپ کے دن کی ہر ضرورت، ایک جگہ۔",
  "tools.all": "تمام اوزار",
  "tools.note.prayerTimes": "روزانہ نماز کے اوقات",
  "tools.note.ramadan": "سحر و افطار کے اوقات",
  "tools.note.tracker": "ریکارڈ رکھیں اور تسلسل بنائیں",
  "tools.note.duas": "حصنُ المسلم",
  "tools.note.plans": "منظم مطالعہ",
  "tools.note.qibla": "مکہ کی سمت",
  "tools.note.mosques": "نماز کی جگہ تلاش کریں",
  "tools.note.hifz": "وقفہ وار دہرائی",
  "tools.note.calendar": "اسلامی تواریخ",
  "tools.note.names": "الاسماء الحسنیٰ",
  "tools.note.tasbih": "ذکر کاؤنٹر",
  "tools.note.adhkar": "صبح · شام",
  "tools.note.zakat": "۲.۵٪ کیلکولیٹر",
  "tools.note.hadith": "مجموعوں میں تلاش کریں",
  "tools.note.downloads": "آف لائن قاری آڈیو",
  "tools.nextPrayer": "اگلی نماز",
  "tools.inTime": "{time} میں",
  "tools.inTimeAt": "{time} میں · {place}",
  "tools.prayerCardSub": "روزانہ نماز · آپ کا مقام",
  "tools.viewPrayerTimes": "نماز کے اوقات دیکھیں",
  "tools.qiblaBearing": "قبلہ · {degrees}° {point}",
  "tools.qiblaSub": "کعبہ کی سمت",
  "tools.qiblaNoLocation": "سمت دیکھنے کے لیے اپنا مقام مقرر کریں",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
  "settings.languageHint":
    "ایپ کے انٹرفیس کی زبان منتخب کریں۔ قرآن اور ترجمے کا متن متاثر نہیں ہوگا۔",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
