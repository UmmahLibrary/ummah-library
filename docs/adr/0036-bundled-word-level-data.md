# ADR 0036 — Bundle word-level recitation timings from open upstreams (and why not transliteration)

- **Status:** Accepted
- **Date:** 2026-06-28

## Context

Three word-level reader features address words by a shared 0-based index (the
reader tags each word `.w[data-w=i]`): **audio word-highlighting** during
playback, **tap-a-word-to-hear** ([#145](https://github.com/)), and **word-by-word
transliteration** ([#144](https://github.com/)). Today all three pull their
per-word data **live from the quran.com API** at runtime — timing segments via
`verses/by_key?audio=`, transliteration via `verses/by_chapter?words=true`.

Live-fetching has real failure modes: quran.com API rate-limits (worse behind
shared egress IPs), outages, regional blocking, and a hard dependency on a third
party. It is also constrained by the **quran.com Developer Terms of Service**,
which forbid **redistribution** and **caching/storing content beyond one week** —
so the API output cannot be bundled, only displayed live.

We researched the *true upstreams* of this data (not the API) to see what can be
bundled cleanly. The rule from [`ATTRIBUTION.md`](../../ATTRIBUTION.md): bundle
only data whose **own** licence permits it (CC-BY/CC0/MIT/PD), sourced from that
upstream — never copied from the quran.com API. Two layers must both pass: the
API ToS **and** the data's licence.

The findings split sharply by data type:

| Data | True upstream | Licence | Bundleable? |
| ---- | ------------- | ------- | ----------- |
| **Word-timing segments** | [quran-align](https://github.com/cpfair/quran-align) (Collin Fair) | **CC-BY-4.0** (data) | **Yes** |
| **Word transliteration** (macron form) | Quranic Arabic Corpus (Kais Dukes) | GPL; *macron form not in the open download* (Buckwalter only) | **No clean dataset** |
| Recitation audio | reciters/publishers via everyayah/quranicaudio | personal-use only | No (stream only) |

## Decision

**1. Bundle word-by-word recitation timings from quran-align (CC-BY-4.0).**
A new ingest step (`ingestTimings` in `packages/data/scripts/ingest.ts`)
downloads the quran-align `release-2016-11-24` zip, expands each reciter's
`[wordStart, wordEnd, startMs, endMs]` ranges into one compact `[wordIndex,
startMs, endMs]` per word, and writes `datasets/timings/{reciterId}/{surah}.json`
plus a `timings/index.json`. A pinned SHA-256 guards against upstream drift, like
the IndoPak ingest ([0035](0035-indopak-script.md)).

**2. Serve it static, behind a port.** A new core port
`RecitationTimingRepository` (implemented by `FileRecitationTimingRepository` in
`packages/data`) is served by a `force-static` route
`/api/v1/recitations/{reciterId}/surahs/{n}/timings`, prerendered per
reciter×surah — no runtime function (honours [0003](0003-static-first-delivery.md)).

**3. The player prefers bundled timings; live is the fallback.** `ReadingAudio`
now resolves timing via `getTiming()`: bundled segments first (audio URL built
deterministically from the reciter's everyayah `audioUrlTemplate` via the pure
`reciterAudioUrl`, so **no quran.com API call**), then the live quran.com API for
reciters/ayahs the bundle doesn't cover, then plain audio with no highlighting.

**4. Coverage: 7 of 8 reciters.** quran-align covers Alafasy, Abdul Basit
(Murattal), Husary, Minshawi (Murattal), Shatri, Shuraym, Sudais — matched by
**performance**. **Al-Ghamdi is not in the dataset** and keeps its existing
behaviour (no quranComId → no highlighting). Two reciters (Abdul Basit, Husary)
align against a different *bitrate* of the same everyayah performance; MP3
re-encodes preserve per-ayah duration, so timings match within a frame, and any
mismatch self-heals via the live fallback.

**5. Do NOT bundle word transliteration — keep it live-fetched.** The macron
romanization (`al-ḥamdu`) the app shows is the **Quranic Arabic Corpus's** (Kais
Dukes, GPL) — *not* quran.com's own data — but it exists only as the corpus's
*website rendering*; the open download ships **Buckwalter only**
(`{l~aHomadu`). No word-level, readable-Latin, validly-open dataset exists — every
candidate traces to the quran.com API or the all-rights-reserved QuranWBW lineage,
including repos that mislabel it MIT. The only clean way to bundle it would be to
**derive** a romanization at ingest from the public-domain Tanzil text using a
standard scheme (ALA-LC/IJMES) — a computed transliterator we are **deferring**
(it won't byte-match the familiar output, needs tashkeel-aware rules, and can't be
scholar-verified by a sole maintainer). Transliteration therefore stays a live,
display-only quran.com fetch (within the API ToS), made robust by a render-time
length guard (see [#144]).

**Scope:** web reader only. Mobile (`useSurahAudio`) and the IndoPak-text
licensing fix are separate follow-ups.

## Alignment

quran-align defines a "word" by splitting Tanzil's `quran-uthmani.txt` on spaces
— **identical** to our bundled Uthmani `text.split(" ")` and to the reader's
`data-w` indices. Verified: **6230/6236 ayahs (99.9%)** exact word-count match per
reciter. The ~6 mismatched ayahs and the handful of ayahs quran-align failed to
align (it emits an error string; one file, As-Sudais, also prepends a "Crashed
Command" dump the parser strips) are **skipped** — those ayahs fall back to the
live source or to no highlighting. A data test asserts the alignment contract for
surah 1.

## Consequences

- **Reliability/offline:** word highlighting and tap-to-hear no longer call the
  quran.com API for the 7 bundled reciters — they work offline when the audio is
  cached, and survive API rate-limits/outages (audio streams from a separate CDN).
- **Size:** ~10 MB added to `datasets/` (gzipped ~3–4 MB; per-surah fetches a few
  KB). Acceptable for a static-first data repo; revisit if it grows.
- **Licence hygiene:** the bundled data is CC-BY-4.0, attributed to Collin Fair /
  quran-align in `ATTRIBUTION.md`; nothing is copied from the quran.com API.
- **Audio source shift:** bundled reciters now play everyayah audio (their
  `audioUrlTemplate`) rather than quran.com-hosted files — same recordings.
- **Transliteration stays a third-party runtime dependency** — accepted, because
  no clean bundleable source exists and we won't author a romanizer yet.
