# ADR 0010 — Translation selection: grouped, searchable, local-first

- **Status:** Accepted (delivery §3 superseded by [0011](0011-translation-catalog-runtime.md))
- **Date:** 2026-06-06

## Context

The reader ingests several translation editions (0002, 0005) and, until now,
exposed them as a **flat row of chips** — one per edition — with a single
`Translation`/`Reading` mode toggle. That works for a handful of editions but
doesn't match how Quran.com and peers let users manage translations, and it
degrades as the catalogue grows across many languages.

Quran.com's model (researched from `api.quran.com/api/v4/resources/translations`
— ~100 editions across ~66 languages): a settings surface that **groups editions
by language**, offers a **text search**, and shows a **"My Translations"**
summary of the current picks; plus a two-level reading control — _Verse by verse_
vs _Reading_, and within _Reading_, _Arabic_ vs _Translations_.

## Decision

**1. Selection model.** Editions are presented **grouped by language**, with a
**search** over name/author/language and a **"My Translations"** summary. The
grouping, ordering, and (diacritic-insensitive) matching are **pure functions in
`core`** (`groupTranslationsByLanguage`, `filterTranslations`), unit-tested; the
human-readable language names are reference data in `core/src/languages.ts`,
shared by web and mobile. The web UI (`TranslationSettings`, `EditionManager`) is
a thin shell over them.

**2. Reading sub-mode.** A nested toggle adds **Reading → Translations**
(continuous reading _with_ translations) alongside the existing **Reading →
Arabic**. Three values in `ul.readingMode`: `translation`, `reading`,
`reading-tr`; the legacy `reading` value still works. Visibility is driven by the
`html[data-reading-mode]` attribute (restored pre-paint), no extra DOM.

**3. Delivery — render-all + toggle, for now.** All ingested editions are still
rendered into every page and shown/hidden client-side via `.tr--off`; selection
stays **local-first** in `localStorage` (extends 0006), never zero-selected. We
**keep this** rather than fetching selected translations at runtime, because the
ingested catalogue is small. **Trigger to revisit:** when the ingested set grows
past roughly **15 editions**, or the per-page translation payload becomes a
measurable bundle/render regression — at which point translations move to a
**runtime fetch** behind the existing content-plugin port (a `runtime-json`
delivery mode, 0005), and this ADR is superseded.

## Consequences

- A scalable, familiar selector; logic is pure and tested, UI stays thin.
- No new dependency edges, no DB, no API change — fully consistent with
  static-first (0003) and local-first (0006).
- The render-all approach has a known ceiling; the trigger and the migration path
  (runtime-json plugin) are recorded so the decision is revisited deliberately,
  not by accident.
