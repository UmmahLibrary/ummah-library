# Permission request — word-by-word Qurʾān data

A ready-to-send request asking the rights-holder to permit use of word-by-word
Arabic→English data in this free, open-source project. **Until a written grant
is received, we do not bundle this data** — the reader shows word meanings by
fetching them live from quran.com at runtime (display only, no redistribution).

Track the outcome here once you hear back (date, who replied, what was granted,
any conditions). If granted, add the source to [`/ATTRIBUTION.md`](../../ATTRIBUTION.md)
and wire the ingest step.

---

## Who to ask

1. **Tarteel / Quranic Universal Library (QUL)** — the hub that hosts the
   word-by-word translations. Contact: the QUL "Resources" page lists a contact
   per resource; or email **hello@tarteel.ai** / open an issue at
   <https://github.com/TarteelAI/quranic-universal-library/issues>.
2. **The word-by-word author** — the widely-used English word-for-word is by
   **Dr. Shehnaz Shaikh & Ms. Kausar Khatri**. If QUL points to them as the
   rights-holder, the request below can be re-addressed to them.

---

## Draft (email / issue)

> **Subject:** Permission to use word-by-word Qurʾān data in a free, open-source app
>
> Assalāmu ʿalaykum,
>
> I maintain **Ummah Library** (<https://github.com/UmmahLibrary/ummah-library>),
> a **free, non-commercial, open-source** Qurʾān reader and Islamic-knowledge
> platform. There are no ads and nothing is sold — it is intended as
> _ṣadaqah jāriyah_. The project is licensed **AGPL-3.0-only**, so the source
> (and any data it bundles) is openly available to everyone.
>
> I would like to include your **word-by-word Arabic→English data** (per-word
> meaning and, if available, transliteration) so readers can learn Qurʾānic
> vocabulary offline. Specifically, I am requesting permission to:
>
> 1. **bundle and redistribute** the word-by-word data within the open-source
>    repository (which, under AGPL-3.0, means downstream users may also copy it); and
> 2. **display** it in the app, with clear, prominent attribution to you on every
>    use and in our `ATTRIBUTION.md`.
>
> I will honour any conditions you set — for example **no modification** of the
> text (we would keep it verbatim and validated against tampering), required
> wording for the credit, a link back, or restriction to non-commercial use.
> If you would prefer that we **not** bundle it, may we instead fetch it from
> your API/CDN at runtime under agreed terms?
>
> Could you let me know (a) whether this is permitted, (b) the exact attribution
> you require, and (c) any conditions? If the rights belong to someone else,
> I would be grateful for a pointer so I can ask them directly.
>
> Jazākum Allāhu khayran for making this knowledge available.
>
> — Rashid Mahmood, Ummah Library

---

## Transliteration — a separate, GPL-licensed source

The word-by-word **transliteration** (the macron form, e.g. `al-ḥamdu`, `l-raḥmāni`)
is a **different work with a different rights-holder** from the English *meaning*
above, so it needs its own ask:

- **Author/owner:** the **Quranic Arabic Corpus** (Kais Dukes), **GNU GPL** — _not_
  quran.com (who only host it) and _not_ QuranWBW. quran.com's API serves it
  byte-for-byte from the corpus.
- **The snag:** the readable macron form exists only as the corpus *website
  rendering* and via **QUL resource 71** ("English WBW transliteration"); the
  corpus's open download ships **Buckwalter only** (`{l~aHomadu`), and QUL's
  download is account-gated with no license surfaced on the resource page.
- **Licence posture:** GPL *permits* redistribution (with source indicated + a
  link back + verbatim/no-changes), and a mechanical romanisation of public-domain
  scripture is in any case likely uncopyrightable — so we may well be clear to
  bundle. We are asking mainly to (a) obtain the macron data **as a file** and
  (b) get the licence **confirmed in writing** before relying on it.

Until then the reader fetches transliteration **live from quran.com at runtime**
(display only — the same way quran.com's own site consumes it), made robust by a
length guard that drops the row rather than misaligning it (ADR 0036).

### Draft (append to issue #638, or email hello@tarteel.ai / corpus.quran.com)

> **Subject:** Licence for the word-by-word *transliteration* (QUL resource 71)
>
> Assalāmu ʿalaykum,
>
> Alongside the word-by-word meanings (above), I'd like to bundle the **word-by-word
> transliteration** — the macron form your API returns (e.g. `bis'mi l-lahi
> l-raḥmāni l-raḥīmi`), which I understand originates from the **Quranic Arabic
> Corpus** (Kais Dukes) and is surfaced as **QUL resource 71**. My project is the
> free, non-commercial, AGPL-3.0 **Ummah Library**.
>
> Could you let me know: (1) the **licence** that applies to resource 71's
> transliteration, (2) whether I may **bundle and redistribute** it verbatim, with
> attribution to the Quranic Arabic Corpus and a link to corpus.quran.com (and any
> exact wording you require), and (3) whether you can provide it as a **downloadable
> file** (the open corpus download is Buckwalter-only)? If the rights sit with Kais
> Dukes / the corpus rather than QUL, a pointer so I can confirm with them directly
> would be much appreciated.
>
> Jazākum Allāhu khayran.
>
> — Rashid Mahmood, Ummah Library

---

## Outcome log

| Date | Contacted | Reply | Granted? | Conditions |
| ---- | --------- | ----- | -------- | ---------- |
| 2026-06-20 | QUL repo — [issue #638](https://github.com/TarteelAI/quranic-universal-library/issues/638) (word meanings) | awaiting | — | — |
| 2026-06-28 | _pending_ — transliteration / QUL resource 71 (append to #638 or email) | not yet sent | — | — |
