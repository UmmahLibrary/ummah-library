# 0043 — One app across platforms: navigation, reading modes, āyah actions, Quran and Urdu faces, list style

- **Status:** Accepted
- **Date:** 2026-11-16
- **Builds on:** 0023 (Noor design system), 0035 (IndoPak), 0040 (UI localization), 0041 (readable for everyone), 0042 (shared scale tokens)

## Context

After the shared tokens and parts (ADR 0042), six differences between web and
mobile were left as product decisions. They could not be settled by tokens.
The owner accepted the recommended option for each. AGENTS.md makes the web app
the reference implementation, so where the two differed, mobile moved to web.

## Decision

1. **Tab bar.** Both apps use web's five places: **Today · Quran · Prayer ·
   Learn · More**, grouped as in web's `lib/nav.ts`.
   - **Quran:** surahs, search, reading plans, memorization, reading goals,
     bookmarks and tafsir.
   - **Prayer:** times, tracker, qibla, Ramadan and mosques.
   - **Learn:** duʿās, adhkār, hadith and the 99 names.
   - **More:** settings, tasbih, Hijri calendar, zakat, downloads, journey and
     privacy.

   Mobile has one hub screen per tab, matching web's hub pages, and one map
   from screen to tab (`navigation/routes.ts`) for every cross-tab jump. This
   also fixed Search's "Names" result, which never opened. The Quran group's
   other places appear as shortcut chips under the Quran title on both apps;
   on a phone, web hides its sidebar. Deep-link URLs are unchanged.

2. **Reading modes.** Both apps use **Verse by verse · Reading · Mushaf**.
   - **Reading:** the continuous Arabic, then the continuous translation.
   - **Mushaf:** the Arabic alone on a framed page.

   Mobile's former "Reading" (Arabic only) and "Translation" (translation only)
   are both still there, inside these two modes. The page-by-page view stays on
   the reader's Mushaf header button.

3. **Āyah actions.** Both apps show **Play · Save · Tafsir · More**. On
   mobile, Tafsir opens the commentary in place, and More is a sheet with
   Share, Copy verse and Memorize. Web's share-as-image and reflections are not
   on mobile yet.
4. **Quran font.** **Amiri Quran** on both. It was drawn for the Quran's
   marks, and mobile already used it. On web it is loaded with `next/font` and
   applied to the reader, the Mushaf, the verse of the day, Go to previews,
   saved āyāt and āyah search results. The ﴿n﴾ markers stay on Amiri, and
   IndoPak keeps its own face (ADR 0035). Only the face changes, never the text
   or its marks. The 6,236-āyah integrity test still passes.
5. **Urdu interface on mobile.** Set in **Noto Nastaliq Urdu**, as on web,
   with taller lines (at least 1.9× the size; 2.2× for Urdu translations). React
   Native cannot stack fonts, so mobile chooses per piece of text:
   - Text with Urdu's own letters becomes Nastaʿlīq. So does any Arabic-script
     text in an interface face while the interface is Urdu.
   - Latin runs inside Urdu text keep Hanken, as the browser's font fallback
     does on web.
   - The Quran faces are never changed, and text that names an Arabic face on
     purpose (surah names) keeps it.
   - Native header titles and tab labels follow the interface language.
6. **List style.** **Rows on phones, cards from 700px up**, on both apps:
   `ListRow surface="adaptive"`. Web switches with a generated media rule;
   mobile uses the window width.

## Consequences

- A reader moving between web and mobile finds the same places, modes and
  actions under the same names, and sees the same Quran face.
- Mobile's Tools and Memorize tabs are gone. Their screens moved, and saved
  navigation state from older builds falls back to Today.
- New screens go in the tab web puts them in. Add the screen to `TAB_OF` and,
  if it is a destination, to the hub list.
- Copy that names an action's old place (the Hifz empty state says "tap
  Memorize on any āyah") should say "More → Memorize". That is a copy change
  for both apps.
