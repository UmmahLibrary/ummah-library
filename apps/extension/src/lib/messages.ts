/**
 * UI message catalogue (#208) — extension mirror of
 * `apps/web/src/i18n/messages.ts`/`apps/mobile/src/i18n/messages.ts`. English is
 * the source of truth and defines the key set (`MessageKey`); every other locale
 * is a `Record<MessageKey, string>` the compiler forces to stay complete. This is
 * a **starter slice** (the popup's own chrome) that proves the mechanism on this
 * platform, mirroring the other two apps' Phase 0–1 scope (ADR 0040) —
 * extracting the rest of the popup is incremental follow-up under #208.
 *
 * The `common.*` keys and their Urdu text are copied verbatim from the other
 * apps' catalogues so all three platforms describe the same choice identically;
 * `popup.*` is extension-only (its compact popup has no nav/tab-bar equivalent).
 *
 * The Urdu strings are a first pass flagged for **native review** before
 * release — the localization *infrastructure* is what this change lands, not
 * authoritative translations.
 */
import type { Locale } from "./locale";

export const en = {
  "popup.verseOfDay": "Verse of the day",
  "popup.jumpToSurah": "Jump to a sūra",
  "popup.theme": "Theme",
  "popup.openApp": "Open Ummah Library",
  // Common chrome (kept in sync with the web/mobile catalogues)
  "common.settings": "Settings",
  "common.language": "Language",
} as const;

export type MessageKey = keyof typeof en;

// First-pass Urdu (RTL) — نظرِ ثانی درکار / needs native review.
const ur: Record<MessageKey, string> = {
  "popup.verseOfDay": "آج کی آیت",
  "popup.jumpToSurah": "سورہ تلاش کریں",
  "popup.theme": "تھیم",
  "popup.openApp": "امہ لائبریری کھولیں",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
