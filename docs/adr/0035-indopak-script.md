# ADR 0035 — IndoPak Arabic script as a second Quran edition

- **Status:** Accepted (amended 2026-06-28 — IndoPak text is **not bundled**)
- **Date:** 2026-06-26 (accepted 2026-06-27)

## Amendment (2026-06-28): IndoPak text is fetched live, not bundled

The original decision below **bundled** the IndoPak text (`arabic-indopak.json`,
ingested from `api.quran.com`). A later licensing review (see ADR 0036 and
[`ATTRIBUTION.md`](../../ATTRIBUTION.md)) found this is **not permissible**:

- The IndoPak text's source (Ayman Siddiqui's data → [QUL resource 55](https://qul.tarteel.ai/resources/quran-script/55))
  carries a **"do not redistribute / Sadaqa-e-Jaria only"** notice with no FOSS
  licence, and quran.com's / Tarteel's **Terms forbid redistributing** their
  content. No openly-licensed IndoPak text dataset exists.
- This violated our own rule ([`ATTRIBUTION.md`](../../ATTRIBUTION.md)): bundle
  only data whose licence permits it; otherwise fetch from the source at runtime.

**Superseding decision:** the IndoPak text is **no longer bundled**. The bundled
`arabic-indopak.json`, its ingest step, the static `/api/v1/surahs/{n}/indopak`
route, and the `indopakQuranRepository` wiring are removed. The reader now fetches
IndoPak **live from quran.com for display only** (which the API ToS permits),
exactly as the word-by-word popover and transliteration already do —
`fetchSurahIndopak` in `apps/web/src/lib/script.ts`. Everything else stays: the
script toggle, the self-hosted IndoPak font, locale defaulting, and word
highlighting / tap-to-hear (quran.com's numbered words still align 1:1 with the
bundled audio segments). Trade-off: IndoPak now needs a network connection (it
falls back to Uthmani offline). A permission request to bundle it is tracked in
[`docs/permissions/`](../permissions/word-by-word-data-request.md).

The original (now-superseded) reasoning is kept below for the record.

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

**4. The IndoPak text and font are a matched pair; render quran.com's text in
quran.com's font — self-hosted.** The decisive lesson after several wrong turns: a
generic font does not give the IndoPak rendering — the text and the font are refined
*together*. A generic Naskh face (Amiri, Scheherazade New) keeps Uthmani-style
letterforms and standard-Arab mark placement, so the words don't read as IndoPak and a
subcontinental reader misreads marks (`رَبِّ` reads "rabal" not "rabbi"). Our text is
quran.com's `text_indopak`, so we render it in **quran.com's own IndoPak face** —
"AlQuran IndoPak by QuranWBW" (`indopak-nastaleeq-waqf-lazim`; "nastaleeq" in the name
notwithstanding, it is the upright IndoPak mushaf face quran.com and Islam360 show).
That pairing gives **both** the distinctive IndoPak letterforms **and** the correct open
jazm. The font is **self-hosted** (`apps/web/public/fonts/`, same-origin) with
`font-display: block`. We first tried loading it cross-origin from the Quran Foundation
integrator CDN, but that proved unreliable — slow or blocked loads silently fell back to
Amiri, which rendered the wrong letterforms (so "the words don't change") and a
digit-less verse marker. Self-hosting is licence-compatible: the font's terms (credit,
no-modification, "Sadaqa-e-Jaria") permit redistribution **with attribution**, which we
ship verbatim + credit ([ATTRIBUTION](../../ATTRIBUTION.md)) — the same posture as the
bundled text in #6. The verse-number marker (`﴿n﴾`) is pinned to **Amiri** in every
script, because the IndoPak face draws it as a digit-less decorative rosette. The UI
exposes the choice as a two-option **Uthmani | IndoPak** selector (not an on/off toggle)
so the active script is always visible. (Earlier drafts tried Noto Nastaliq Urdu,
Scheherazade New, me_quran, Digital Khatt, PakType and Al Qalam — each rejected for
wrong marks, a required shaping engine, or missing glyphs.)

**5. Word-level parity via quran.com's numbered words.** Per-word audio highlighting,
tap-to-hear and the word popover ([0008](0008-recitation-audio-highlighting.md)) align
**by word index**, and IndoPak's raw word boundaries differ from Uthmani's — standalone
waqf marks, a split conjunction `وَ`, occasional joins (~43% of ayahs) — so a naive
space-split drifts and highlights the wrong word. Instead the ingest stores each IndoPak
verse as **quran.com's numbered words** (`char_type=word`, in recitation order) — the
*same* word units the audio segments are numbered against (verified: e.g. 2:3 word #4 is
`"وَ يُقِيۡمُوۡنَ"`, kept whole, and 8 words ↔ 8 segments). The reader renders them as
`.w[data-w=i]` spans, so the existing highlighter — and tap-to-hear and the word popover —
work unchanged. The words are **bundled** (offline-capable), so highlighting needs no
runtime fetch. Word-by-word *transliteration* stacking under IndoPak is a later refinement.

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
- **Operational note:** the offline service worker (cache-first for CSS/fonts) must
  **not** register in development — while it did, it silently served stale CSS/fonts and
  masked the font work for days. It is now env-guarded (registers in production only; in
  dev it unregisters itself and clears its caches).
- **Limit & trigger to revisit:** depends on a single upstream (QUL /55 ·
  `api.quran.com`) for the text; the checksum guard surfaces drift, but a vanished source
  needs a replacement. The font is **bundled** (self-hosted with attribution, terms
  permitting), so it no longer depends on the integrator CDN. Per-device until export
  ([0018](0018-local-data-backup.md)) / sync (#25).
