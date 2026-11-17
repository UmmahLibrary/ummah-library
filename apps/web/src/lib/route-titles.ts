/**
 * Browser tab titles for the app's own pages, as i18n keys (ADR 0041). Page
 * metadata is built in English; the shell swaps in the reader's language.
 * Pages named after content (a surah, a juzʾ, a page, a hadith book, a blog
 * article) keep their built title — those are names, like the theme names.
 */
import type { MessageKey } from "../i18n/messages";

export const ROUTE_TITLES: Readonly<Record<string, MessageKey>> = {
  "/quran": "nav.quran",
  "/search": "nav.search",
  "/hifz": "nav.hifz",
  "/plans": "nav.plans",
  "/goals": "nav.goals",
  "/bookmarks": "nav.bookmarks",
  "/collections": "title.collections",
  "/tafsir": "nav.tafsir",
  "/juz": "title.juz",
  "/prayer": "nav.prayer",
  "/prayer-times": "nav.prayerTimes",
  "/tracker": "nav.tracker",
  "/qibla": "nav.qibla",
  "/ramadan": "nav.ramadan",
  "/mosques": "nav.mosques",
  "/learn": "nav.learn",
  "/duas": "nav.duas",
  "/adhkar": "nav.adhkar",
  "/hadith": "nav.hadith",
  "/names": "nav.names",
  "/kids": "nav.kids",
  "/blog": "nav.blog",
  "/more": "nav.more",
  "/settings": "common.settings",
  "/tasbih": "nav.tasbih",
  "/calendar": "nav.calendar",
  "/zakat": "nav.zakat",
  "/downloads": "nav.downloads",
  "/profile": "nav.profile",
  "/privacy": "title.privacy",
  "/offline": "title.offline",
  "/tools": "title.tools",
};

/** The title key for a path, or null to keep the built (content-named) title. */
export function routeTitleKey(pathname: string): MessageKey | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ROUTE_TITLES[path] ?? null;
}
