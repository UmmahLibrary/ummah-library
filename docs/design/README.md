# Design reference

A frozen snapshot of the **frontend redesign** the web app is being moved toward.
This is a **reference, not production code** — nothing here is built, bundled, or
imported by `apps/web`. The real implementation lives in `apps/web`; we restyle it
toward this design screen by screen.

The files here are a committed snapshot so the design is **versioned and diffable**
in git and so contributors can view it without any account or build step.

## The design — "Noor"

`noor-prototype/` is a runnable prototype of the **whole app** in the **Noor**
design language: premium and modern, **Hanken Grotesk** (Latin) +
**IBM Plex Sans Arabic** (Arabic), a tokenised palette, and an 8‑point **khatam**
star as the signature motif. It's built as in‑browser React — `index.html` loads
the readable `app/*.jsx` modules and compiles them with Babel, so there's no build
step.

### Themes

Eight built‑in themes. Switching one recolours the **entire** app, accent included
(the reader follows too — the accent is gold by default, teal or rose in others):

- **Dark** — Obsidian (charcoal & gold, the default), Midnight (true‑black, high contrast), Emerald (deep green & gold), Ocean (slate & teal)
- **Light** — Ivory (warm paper & gold), Sepia (parchment & amber), Mint (cool light & teal), Rose (soft light & rose)

A top‑bar toggle flips dark ↔ light (remembering the last theme used per mode); the
full picker lives in Settings.

### Navigation

- **Desktop** — a left sidebar grouped into **Read / Memorize / Worship / Learn**, plus a top bar with global search (⌘K), the theme toggle, the Hijri/Gregorian date, and a profile avatar.
- **Mobile** — a bottom tab bar: Home, Read, Tools, Memorize, More.
- First run shows a short **onboarding** (reading goal, reciter, translation); after that it opens on the home screen.

### Screens

Covers every current app area — Surah reader, Search, Bookmarks, Tafsir, Hifz,
Reading Goals, Prayer Times, Duʿās, Qibla, Adhkār, Tasbih, Ramadan, Hadith,
99 Names, Hijri Calendar, Zakat, and Settings — plus areas not in the app yet:
**Onboarding, Reading Plans, Prayer Tracker, and Profile**.

The **Surah reader** is the centrepiece: three reading modes, word‑by‑word,
colour‑coded **tajwīd**, a reciter picker, live font scaling, translation +
transliteration, synced audio with active‑verse highlight and auto‑scroll, and a
per‑ayah action sheet (copy / share / note / tafsir / memorize). **Search** is
global across Quran, hadith, duʿās, names, and tools.

Like the app itself, the prototype is local‑first — theme, last screen, and reading
position persist in the browser.

## How to view

The prototype compiles its modules in the browser, and Babel loads them over
HTTP — so it must be **served**, not opened from disk. Double‑clicking
`index.html` (a `file://` URL) shows a blank page, because the browser blocks
those module fetches.

Serve the folder with any static server and open the URL it prints, e.g. from the
repo root:

```bash
npx serve docs/design/noor-prototype
```

Then open the printed `http://localhost:…` address. It also **needs internet** —
React, Babel, and Google Fonts load from a CDN.

## How to propose a design change

This design evolves over time. To change it, update the snapshot in this folder in
the same PR as any related code, so the git history records each design revision
alongside the code that implements it.
