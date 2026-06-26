# ADR 0035 — IndoPak Arabic script as a second bundled Quran edition

- **Status:** Proposed
- **Date:** 2026-06-26

## Context

The app ships Quran Arabic in **Uthmani only** ([0002](0002-quran-data-sourcing.md)).
The South-Asian audience (India, Pakistan, Bangladesh) reads the **IndoPak** mushaf
orthography. IndoPak is a distinct **text encoding** — different spelling, vowel-mark
placement, and waqf (pause) signs — **not** a font swap on the Uthmani text, so it
needs its own verse data.

The forces are the same three as [0002](0002-quran-data-sourcing.md) — **authenticity**
(sacred text, attributed), **licensing** (AGPL — bundled content's terms must be
honoured), **reproducibility** (regenerable, never hand-fixed) — plus two constraints:
it must not regress **static-first, no-backend** delivery ([0003](0003-static-first-delivery.md))
or **local-first** state ([0006](0006-local-first-persistence.md)), and the sole
maintainer **cannot satisfy `needs-scholar-review`** alone, so we use a faithful,
established source and tag it — never authored interpretation.

## Decision

**1. IndoPak is a second bundled Arabic edition, ingested like Uthmani (extends [0002](0002-quran-data-sourcing.md)).**
A new step in `packages/data/scripts/ingest.ts` fetches the IndoPak text, validates
114/6236, and writes a committed `datasets/arabic-indopak.json` (edition id
`ara-indopak`). The [QUL resource /55](https://qul.tarteel.ai/resources/quran-script/55)
export is the **upstream of record**, but its download is **login-gated** and so cannot
be fetched reproducibly; the ingest instead uses the anonymous
[`api.quran.com`](https://api.quran.com/api/v4/quran/verses/indopak) mirror of the same
IndoPak text — the same source the word-by-word transliteration ([0008](0008-recitation-audio-highlighting.md))
already uses — aligned 1:1 with our Hafs sura:aya numbering. A **pinned SHA-256** over
the normalized verses (`INDOPAK_SHA256`, stored as `edition.checksum`) fails the ingest
loudly if the upstream text drifts. The committed snapshot is the runtime source of
truth, so upstream edits cannot reach users between deliberate, reviewed re-ingests.
Like Uthmani, quran.com does not prepend the Basmala to each surah's first ayah, so the
text is already pure; it is lifted from 1:1 and stored once on the edition. Generated
files are never hand-edited.

**2. Delivered static-first, no backend (honours [0003](0003-static-first-delivery.md)).**
The default (Uthmani) stays baked into the statically generated reader pages. IndoPak
is emitted as **per-surah static JSON**, fetched client-side only when selected and
cached (browser + service worker + CDN). Storage is **per surah, not per juz**, so one
file serves both the surah and juz readers; a juz loads one file per surah it spans. No
serverless function — contrast [0011](0011-translation-catalog-runtime.md), where the
*full ~490-edition* translation catalogue is runtime-fetched because it is too large to
bundle; a single extra Quran text is not.

**3. Script choice is local-first state behind a store port.** A
`script: "uthmani" | "indopak"` reader preference persists behind the existing reader
settings store ([0024](0024-local-storage-ports.md), enforced by [0028](0028-persistence-enforcement.md)),
defaulting to IndoPak when `navigator.language` is `ur`/`hi`/`bn` (overridable) —
mirroring the existing Urdu-translation locale default ([0010](0010-translation-selection.md)).
Web emits a window event to re-render; mobile holds it in component state.

**4. The IndoPak font is self-hosted, loaded on demand.** `next/font/local`
(`--font-indopak`), applied only in IndoPak mode so the (large) file is fetched only by
readers who use it; the woff2 is subset where the font licence permits.

**5. v1 is reading-view only; word-level features stay on Uthmani.** Per-word audio
highlighting and word-by-word transliteration ([0008](0008-recitation-audio-highlighting.md))
align **by word index**, and IndoPak word boundaries differ. v1 renders IndoPak at
ayah granularity; carrying the canonical word index from the QUL export to restore
parity is a deferred fast-follow.

**6. Licensing & review.** IndoPak text ships **verbatim** with attribution in the
dataset `edition` fields and `packages/data/ATTRIBUTION.md`; upstream terms (credit +
no-modification, "Sadaqa-e-Jaria") are honoured — we restructure the JSON envelope,
never the text. As a new representation of Quranic text it is tagged
**`needs-scholar-review`** before release (per [0002](0002-quran-data-sourcing.md)).

## Consequences

- **Good:** the largest under-served audience reads in their familiar script; fully
  static and offline-first; the vendored, checksum-guarded snapshot gives stability
  independent of upstream; `ul.script` rides the key-agnostic backup
  ([0018](0018-local-data-backup.md)) for free and the store port is the sync seam
  ([0033](0033-account-sync.md)). Re-ingests land as reviewable diffs.
- **Deliberately excluded:** bundling a second full Quran text **is** redistribution —
  accepted here (against the general "minimise shipped data" lean) because this is
  *core* reading content that must stay offline-first and stable, exactly as Uthmani is
  ([0002](0002-quran-data-sourcing.md)/[0003](0003-static-first-delivery.md)). IndoPak
  word-level features, true Nastaleeq calligraphy, and Urdu-translation Nastaleeq
  restyling are out of scope (the last is an independent change).
- **Limit & trigger to revisit:** depends on a single upstream (QUL /55) for both the
  text and the font; the checksum guard surfaces drift, but a vanished source needs a
  replacement. **Confirm the specific `indopak` font file permits self-hosting/subsetting
  before PR1 ships**; if not, fall back to another OFL/permissive IndoPak-capable font.
  Per-device until export ([0018](0018-local-data-backup.md)) / sync (#25).
