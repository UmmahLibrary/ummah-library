# ADR 0016 — Adhkar: bundled Ḥiṣn al-Muslim content + a pure counter

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

Adhkar (daily remembrances) are the fifth Phase 6 module
([epic #27](https://github.com/UmmahLibrary/ummah-library/issues/27)). Every
adhkar app — Hisnul Muslim apps, Muslim Pro, Athan, Azkar.me — is essentially the
same shape: the **Ḥiṣn al-Muslim** corpus rendered with Arabic + translation +
transliteration, organised into sets (Morning, Evening, after Salah, sleep, …),
with a **tap counter** that tracks the recommended repetitions. The flagship,
highest-use sets are **Morning & Evening**.

Two architectural questions: where does verbatim religious text live, and how do
we handle its authenticity without a scholar on hand?

## Decision

**1. Adhkar is bundled content, behind an `AdhkarRepository` port.** The corpus is
small (the morning/evening sets are ~34 items, 35 KB), so — unlike the large
hadith collections, which are runtime plugins (0005) — it is **ingested into a
bundled `datasets/adhkar.json`** and served by `FileAdhkarRepository`, exactly
like the Quran. This keeps it **fully offline** (0003) and static. The `Dhikr`
entity and the `AdhkarRepository` port live in `core`; the *counter* logic
(`filterByOccasion`, `nextTally`, `isDhikrComplete`, `sessionProgress`) is pure
and unit-tested.

**2. Source from a reputable, pre-vetted dataset — never hand-type.** The text is
ingested (4) from **Seen-Arabic/Morning-And-Evening-Adhkar-DB** (MIT), itself
derived from Ḥiṣn al-Muslim, carrying Arabic, English, transliteration, the
repetition count, the **virtue (faḍl)** and the **graded source** (e.g. "Al-Albani
graded it ḥasan"). The ingest preserves that provenance. Hand-typing verbatim
Arabic — with its diacritics — would be the unsafe path; ingesting a maintained,
referenced dataset is the mitigation.

**3. Local-first daily counter (0006).** The `/adhkar` page has Morning/Evening
tabs; tapping a dhikr increments its tally up to the recommended count, with set
progress. Tallies are stored on the device (`ul.adhkar`) and **reset each
calendar day** — no account, nothing leaves the browser.

**4. Shipped without scholar review, by explicit owner decision** (consistent with
[0015](0015-zakat.md) and issues #19/#22). The risk here is lower than zakat: the
content is *quoted, referenced* text from a recognised compilation rather than a
derived ruling, and each item carries its own source/grading. **Open follow-up:**
a scholar should still verify the Arabic vocalisation, the translations, and the
gradings, and confirm the repetition counts.

## Consequences

- **Good:** a complete, offline, local-first Morning/Evening adhkar experience
  matching the mainstream apps, from one bundled source shared with mobile via
  the port, with provenance attached to every dhikr.
- **Scope:** only Morning & Evening ship now. The same port and dataset shape
  extend to the other Ḥiṣn al-Muslim sets (after-salah, sleep, travel, …) by
  growing the ingest — no architecture change. Audio and notification reminders
  (a natural tie-in to the prayer-times module) are deliberately later.
- **Cost / risk:** as in 0015, without a reviewer the safety rests on sourcing
  discipline and attribution; the verification follow-up stays open.
