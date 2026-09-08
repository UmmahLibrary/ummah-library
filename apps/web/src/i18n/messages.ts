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
  // Settings — theme
  "theme.dark": "Dark",
  "theme.light": "Light",
  // Theme *names* (Obsidian, Ivory, …) are the Noor design system's proper
  // names (ADR 0023) and stay untranslated, like a brand. Their descriptions
  // are prose, so they don't.
  "theme.desc.obsidian": "Charcoal & gold",
  "theme.desc.midnight": "True-black, high contrast",
  "theme.desc.emerald": "Deep green & gold",
  "theme.desc.ocean": "Slate & teal",
  "theme.desc.ivory": "Warm paper & gold",
  "theme.desc.sepia": "Parchment & amber",
  "theme.desc.mint": "Cool light & teal",
  "theme.desc.rose": "Soft light & rose",
  "theme.title": "Theme",
  "theme.hint": "Applies across the whole app",
  // Settings — local data & backup
  "backup.intro":
    "Everything you do here stays on this device — no account, no server. Export a backup file to move your data to another device or keep it safe; import it to restore.",
  "backup.yourData": "Your data",
  "backup.export": "⬇ Export my data",
  "backup.import": "⬆ Import a backup",
  "backup.onImport": "On import",
  "backup.replace": "Replace my data",
  "backup.keepMine": "Keep mine on conflict",
  // Two keys rather than one interpolated string: plural *rules* differ by
  // language, and picking the form in the component keeps that decision in the
  // catalogue. Languages with more than two plural categories (Arabic has six)
  // would need a real plural-rule layer — noted in ADR 0040, not faked here.
  "backup.itemsStored.one": "{count} item stored on this device.",
  "backup.itemsStored.other": "{count} items stored on this device.",
  "backup.erase": "Erase all data",
  "backup.eraseConfirm": "Erase all Ummah Library data on this device? This can’t be undone.",
  "backup.footer": "Ummah Library · local-first · Free & open source",
  // Settings — cross-device sync
  "sync.intro":
    "Keep your bookmarks, reading position and preferences in step across your devices — end-to-end encrypted, with no account. Off by default; the app works fully offline without it.",
  "sync.on": "Sync is on",
  "sync.onHint": "Your data syncs across every device that uses your recovery phrase.",
  "sync.turnOff": "Turn off sync",
  "sync.turnOffConfirm": "Turn off sync and remove the recovery phrase from this device?",
  "sync.copy": "Copy",
  "sync.setUp": "Set up sync",
  // One sentence, not three fragments around a <b>. Splitting it would fix
  // English word order into every translation; the emphasis is worth less than
  // a translator being able to move the clause.
  "sync.setUpHint":
    "Generate a recovery phrase on your first device, then enter the same phrase on each other device to link them. It’s the only key — pick it once and keep it.",
  "sync.phrasePlaceholder": "Enter or generate a phrase",
  "sync.phraseLabel": "Recovery phrase",
  "sync.generate": "Generate",
  "sync.warning":
    "⚠ Your recovery phrase is the only key to your synced data. We can’t see it or recover it — if you lose it, the data can’t be decrypted. Keep a copy somewhere safe (your exported backup file is a good place).",
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
  "theme.dark": "گہرا",
  "theme.light": "روشن",
  "theme.desc.obsidian": "کوئلہ اور سنہرا",
  "theme.desc.midnight": "خالص سیاہ، نمایاں تضاد",
  "theme.desc.emerald": "گہرا سبز اور سنہرا",
  "theme.desc.ocean": "سلیٹی اور فیروزی",
  "theme.desc.ivory": "گرم کاغذ اور سنہرا",
  "theme.desc.sepia": "پارچمنٹ اور عنبری",
  "theme.desc.mint": "ٹھنڈی روشنی اور فیروزی",
  "theme.desc.rose": "نرم روشنی اور گلابی",
  "theme.title": "تھیم",
  "theme.hint": "پوری ایپ پر لاگو ہوتا ہے",
  "backup.intro":
    "آپ یہاں جو کچھ کرتے ہیں وہ اسی ڈیوائس پر رہتا ہے — نہ کوئی اکاؤنٹ، نہ سرور۔ اپنا ڈیٹا دوسری ڈیوائس پر لے جانے یا محفوظ رکھنے کے لیے بیک اپ فائل برآمد کریں؛ بحال کرنے کے لیے اسے درآمد کریں۔",
  "backup.yourData": "آپ کا ڈیٹا",
  "backup.export": "⬇ میرا ڈیٹا برآمد کریں",
  "backup.import": "⬆ بیک اپ درآمد کریں",
  "backup.onImport": "درآمد کرتے وقت",
  "backup.replace": "میرا ڈیٹا تبدیل کریں",
  "backup.keepMine": "تضاد کی صورت میں میرا رکھیں",
  "backup.itemsStored.one": "اس ڈیوائس پر {count} آئٹم محفوظ ہے۔",
  "backup.itemsStored.other": "اس ڈیوائس پر {count} آئٹمز محفوظ ہیں۔",
  "backup.erase": "تمام ڈیٹا مٹا دیں",
  "backup.eraseConfirm": "اس ڈیوائس پر امہ لائبریری کا تمام ڈیٹا مٹا دیں؟ یہ واپس نہیں ہو سکتا۔",
  "backup.footer": "امہ لائبریری · لوکل فرسٹ · مفت اور اوپن سورس",
  "sync.intro":
    "اپنی محفوظات، مقامِ مطالعہ اور ترجیحات کو تمام ڈیوائسز پر ہم آہنگ رکھیں — سرے تا سرے مخفی، بغیر کسی اکاؤنٹ کے۔ بطورِ طے شدہ بند؛ ایپ اس کے بغیر مکمل طور پر آف لائن کام کرتی ہے۔",
  "sync.on": "سنک آن ہے",
  "sync.onHint":
    "آپ کا ڈیٹا ہر اُس ڈیوائس پر ہم آہنگ ہوتا ہے جو آپ کا ریکوری فقرہ استعمال کرتی ہے۔",
  "sync.turnOff": "سنک بند کریں",
  "sync.turnOffConfirm": "سنک بند کر کے اس ڈیوائس سے ریکوری فقرہ ہٹا دیں؟",
  "sync.copy": "کاپی کریں",
  "sync.setUp": "سنک ترتیب دیں",
  "sync.setUpHint":
    "اپنی پہلی ڈیوائس پر ریکوری فقرہ بنائیں، پھر ہر دوسری ڈیوائس پر وہی فقرہ درج کریں تاکہ وہ منسلک ہو جائیں۔ یہی واحد کلید ہے — ایک بار منتخب کریں اور محفوظ رکھیں۔",
  "sync.phrasePlaceholder": "فقرہ درج کریں یا بنائیں",
  "sync.phraseLabel": "ریکوری فقرہ",
  "sync.generate": "بنائیں",
  "sync.warning":
    "⚠ آپ کا ریکوری فقرہ آپ کے ہم آہنگ ڈیٹا کی واحد کلید ہے۔ ہم اسے نہ دیکھ سکتے ہیں نہ بحال کر سکتے ہیں — اگر یہ کھو گیا تو ڈیٹا کو کھولا نہیں جا سکے گا۔ اس کی نقل کسی محفوظ جگہ رکھیں (آپ کی برآمد کردہ بیک اپ فائل اچھی جگہ ہے)۔",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
  "settings.languageHint":
    "ایپ کے انٹرفیس کی زبان منتخب کریں۔ قرآن اور ترجمے کا متن متاثر نہیں ہوگا۔",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
