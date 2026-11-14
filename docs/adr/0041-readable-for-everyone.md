# 0041 — Readable for everyone: labelled controls, comfort, modes and gentle consistency

- **Status:** Accepted
- **Date:** 2026-11-14
- **Builds on:** 0006 (local-first), 0023 (Noor design system), 0024 (stores), 0035 (IndoPak), 0040 (UI localization)

## Context

A design review against research on older readers, children, low-literacy users
and the global Muslim audience (NN/g senior and children studies, WCAG 2.2,
low-literacy HCI work, competitor reviews, habit and streak research) found the
web app polished but hard for many of the people it most wants to serve:
icon-only and single-letter reader controls, 17px-tall per-verse actions (below
the WCAG 2.2 24px minimum), floating pills covering verse text on phones,
"Continue reading" below the fold, a single text-size control for Arabic and
translation together, dark mode for everyone, fire-emoji streak counters, and an
interface that was English-only in practice.

## Decision

1. **Every control says what it does.** Reader, dock, Go to and tab-bar controls
   carry a visible word, are at least 44–48px, and labels are at least 12.5–14px at
   4.5:1 or better. The reader's three floating layers (audio dock, Recite pill,
   Go-to chip) become **one in-flow bottom dock**, so nothing covers Quran text.
2. **One Go to** for 6,236 āyāt: a pure parser in `core` (`goto.ts`) that
   understands `2:255`, a bare āyah, surah names in Latin or Arabic (typo
   tolerant), juz/para, page, hizb and Arabic-Indic digits; pickers underneath; a
   "Back to" chip after a jump; a juz/page scrubber on tablet and desktop only.
3. **Quranic text is protected.** Interface styling must never change how the
   Quran is shaped: a CSS rule forces `letter-spacing: 0`, normal word spacing, no
   text-transform, no synthetic bold/italic and default ligatures on `.arabic`,
   `.ayah-ar`, `.mushaf`, `.basmala` and `[data-quran-text]`. Size changes are pure
   font-size multipliers with generous line-height. Display text is **never
   Unicode-normalized** (Tanzil stores shadda before fatḥa; NFC would reorder
   them) — normalization happens only in search keys. Interface sample āyāt live in
   `lib/quran-samples.ts` and a test asserts they equal the datasets code point for
   code point. IndoPak is only ever shown in its own font (no fallback preview).
4. **Comfort is a first-class setting** (`lib/comfort-store.ts`, local-only,
   applied pre-paint): separate Arabic and translation sizes with higher ceilings
   (never shrinking a saved size), translation emphasis, dyslexia spacing for
   Latin-script translations only, larger buttons, reduced motion. New installs
   follow the device light/dark setting. A five-step, skippable **first-run
   setup** asks language, script, size, light/dark and reading path.
5. **Modes for every age and literacy level**, as modes of one app: **Easy**
   (three big tiles, a big Back/Home bar, press-and-hold to leave), **Listen**
   (`/listen/[n]`, player-first follow-along) and **Kids** (`/kids`, short surahs,
   tap-a-word audio, no streaks, notifications or autoplay). A speaker button reads
   interface text aloud with the device voice; Quranic Arabic is never synthesised.
6. **Five places** — Today · Quran · Prayer · Learn · More — defined once in
   `lib/nav.ts` and shared by the phone tabs, desktop sidebar and hub pages.
7. **Gentle consistency** (`core/consistency.ts`): Home leads with one card
   (continue / welcome back / start / done for today); progress is "N of 7 days
   this week"; a day-streak count is opt-in; tracking can be paused without a
   reason; reading from a printed mushaf can be logged; a 30-juz khatm journey.
   No fire emoji, loss copy, leaderboards or reward counters. The daily reading
   reminder can be anchored to a prayer (`after:maghrib`, resolved in core from
   the existing `PrayerTimingsProvider`), at most one a day.
8. **Interface languages** wave 1: English, Arabic, Urdu, Indonesian, Bengali and
   Turkish through the 0040 runtime, with locale numerals; translations are first
   passes flagged for native review.

## Consequences

- No new dependency, port, server state or account; everything stays local-first.
  Comfort, kids progress and modes are device-local (not synced yet).
- The surah index moves from Home to `/quran`; `/prayer`, `/learn`, `/more`,
  `/listen/[n]` and `/kids` are new static routes.
- Deliberately deferred, each needing its own decision: shared family khatm
  (server or sync state), Quran Foundation QCF page fonts (licence account and
  attribution), a reminder step-down after ignored days (needs interaction
  tracking), colour-blind-tested tajweed palettes (the app has no tajweed colouring
  yet), wave 2–3 languages, and a TV/D-pad layout beyond the large-screen scale-up.
