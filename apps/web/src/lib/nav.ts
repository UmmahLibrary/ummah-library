/**
 * The five places in Ummah Library (ADR 0041): Today · Quran · Prayer · Learn ·
 * More. One model drives the phone tab bar, the desktop sidebar groups and the
 * hub pages, so every surface names things the same way. Labels are i18n keys.
 */
import type { IconName } from "@ummahlibrary/ui";
import type { MessageKey } from "../i18n/messages";

export interface NavItem {
  label: MessageKey;
  note: MessageKey;
  href: string;
  icon: IconName;
}

export interface NavDestination {
  key: "today" | "quran" | "prayer" | "learn" | "more";
  label: MessageKey;
  href: string;
  icon: IconName;
  /** Path prefixes that light this tab up. */
  match: readonly string[];
  items: readonly NavItem[];
}

export const NAV_DESTINATIONS: readonly NavDestination[] = [
  {
    key: "today",
    label: "nav.today",
    href: "/",
    icon: "home",
    match: ["/"],
    items: [],
  },
  {
    key: "quran",
    label: "nav.quran",
    href: "/quran",
    icon: "book",
    match: [
      "/quran",
      "/surah",
      "/juz",
      "/page",
      "/search",
      "/listen",
      "/hifz",
      "/plans",
      "/goals",
      "/bookmarks",
      "/collections",
      "/tafsir",
    ],
    items: [
      { label: "nav.allSurahs", note: "note.allSurahs", href: "/quran", icon: "book" },
      { label: "nav.search", note: "note.search", href: "/search", icon: "search" },
      { label: "nav.listen", note: "note.listen", href: "/listen/1", icon: "headphones" },
      { label: "nav.hifz", note: "note.hifz", href: "/hifz", icon: "star" },
      { label: "nav.plans", note: "note.plans", href: "/plans", icon: "route" },
      { label: "nav.goals", note: "note.goals", href: "/goals", icon: "check" },
      { label: "nav.bookmarks", note: "note.bookmarks", href: "/bookmarks", icon: "bookmark" },
      { label: "nav.tafsir", note: "note.tafsir", href: "/tafsir", icon: "tafsir" },
    ],
  },
  {
    key: "prayer",
    label: "nav.prayer",
    href: "/prayer",
    icon: "compass",
    match: ["/prayer", "/tracker", "/qibla", "/ramadan", "/mosques"],
    items: [
      { label: "nav.prayerTimes", note: "note.prayerTimes", href: "/prayer-times", icon: "home" },
      { label: "nav.tracker", note: "note.tracker", href: "/tracker", icon: "check" },
      { label: "nav.qibla", note: "note.qibla", href: "/qibla", icon: "compass" },
      { label: "nav.ramadan", note: "note.ramadan", href: "/ramadan", icon: "moon" },
      { label: "nav.mosques", note: "note.mosques", href: "/mosques", icon: "home" },
    ],
  },
  {
    key: "learn",
    label: "nav.learn",
    href: "/learn",
    icon: "layers",
    match: ["/learn", "/hadith", "/duas", "/adhkar", "/names", "/blog", "/kids"],
    items: [
      { label: "nav.duas", note: "note.duas", href: "/duas", icon: "hands" },
      { label: "nav.adhkar", note: "note.adhkar", href: "/adhkar", icon: "repeat" },
      { label: "nav.hadith", note: "note.hadith", href: "/hadith", icon: "globe" },
      { label: "nav.names", note: "note.names", href: "/names", icon: "grid" },
      { label: "nav.kids", note: "note.kids", href: "/kids", icon: "star" },
      { label: "nav.blog", note: "note.blog", href: "/blog", icon: "book" },
    ],
  },
  {
    key: "more",
    label: "nav.more",
    href: "/more",
    icon: "menu",
    match: [
      "/more",
      "/settings",
      "/calendar",
      "/zakat",
      "/tasbih",
      "/downloads",
      "/profile",
      "/privacy",
      "/tools",
      "/offline",
    ],
    items: [
      { label: "nav.settings", note: "note.settings", href: "/settings", icon: "settings" },
      { label: "nav.tasbih", note: "note.tasbih", href: "/tasbih", icon: "more" },
      { label: "nav.calendar", note: "note.calendar", href: "/calendar", icon: "cal" },
      { label: "nav.zakat", note: "note.zakat", href: "/zakat", icon: "layers" },
      { label: "nav.downloads", note: "note.downloads", href: "/downloads", icon: "download" },
      { label: "nav.profile", note: "note.profile", href: "/profile", icon: "user" },
    ],
  },
];

/** Which destination a path belongs to ("/" matches Today only exactly). */
export function destinationOf(pathname: string): NavDestination["key"] {
  for (const d of NAV_DESTINATIONS) {
    if (d.key === "today") continue;
    if (d.match.some((m) => pathname === m || pathname.startsWith(m))) {
      return d.key;
    }
  }
  return "today";
}
