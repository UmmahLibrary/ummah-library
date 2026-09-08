# ADR 0042 — Verse↔hadith links: a derived quotation index, not an ingested mapping

- **Status:** Accepted
- **Date:** 2026-09-03
- **Issue:** [#200](https://github.com/UmmahLibrary/ummah-library/issues/200)

## Context

We ship both the Qurʾān and six hadith collections, but `/surah/*` and
`/hadith/*` never connect. [#200](https://github.com/UmmahLibrary/ummah-library/issues/200)
asks for a "Related" affordance on an ayah listing hadith connected to it — the
study-navigation bridge Quran.com added in its 2025–26 reader. It was the #1
untracked gap in the 2026-06-30 competitor sweep, precisely because it reuses
assets we already own.

The issue offers two routes and its own research effectively decides between them.

**Route A — ingest a ready-made verse↔hadith mapping.** The issue surveyed the
candidates and concluded that "no broad, cleanly-licensed, ready-made verse↔hadith
list is known to exist (mid-2026)": `ShathaTm/Quran_Hadith_Datasets` is ~310
benchmark pairs, not coverage; the Semantic Hadith / QuranOntology linked-data
sets are _derived_ from secondary sources with unclear licensing;
`AbdullahGhanem/quran-database` had not shipped its references; Sunnah.com's
redistribution terms are historically restrictive. Worse than the licensing: a
topical mapping is an **interpretive** claim, and repo policy is that we do not
author or ship such mappings without scholar review we do not have.

**Route B — a self-generated quotation index.** Link a hadith to an ayah only
where the hadith **verbatim quotes** it. This was blocked: the ingested hadith
text was English-only, and English translations contain no Arabic Qurʾānic text
to detect against.

**That blocker is gone.** [#52](https://github.com/UmmahLibrary/ummah-library/issues/52)
closed on 2026-08-09 (PR #212) and the collections now carry Arabic —
34,153 of 34,157 hadith across the six books.

## Decision

**Ship route B. Generate the links ourselves, from verbatim quotation only.**

**1. The claim is factual, which is what makes it shippable.** "This hadith's
Arabic contains these words, and so does this ayah" is a statement about two
texts, checkable by anyone, and it needs no scholarly judgement. "This hadith is
_about_ this ayah" does, and we do not make it. `HadithLink.relation` is typed
`"quotes"` and nothing else is produced — the union exists so a vetted topical
mapping can be added later without a schema change, not as a placeholder we
intend to fill ourselves.

**2. A six-word minimum, chosen against the real corpus, not by intuition.**
Arabic religious prose shares enormous amounts of fixed phrasing with the Qurʾān,
so the threshold _is_ the feature. Measured over all 34,157 hadith × 6,236 ayahs:

| Min words | Ayahs linked | Links     | Most-linked ayah's matched span                                |
| --------- | ------------ | --------- | -------------------------------------------------------------- |
| 4         | 951          | 8,076     | `لا اله الا الله` — the shahāda (359 links to one ayah)        |
| 5         | 572          | 2,377     | `وهو علي كل شيء قدير` — a stock clause in ~15 ayahs            |
| **6**     | **411**      | **1,389** | `لقد كان لكم في رسول الله اسوه حسنه` — 33:21, a real quotation |
| 7         | 291          | 859       | —                                                              |
| 8         | 216          | 608       | —                                                              |

Four and five words are dominated by **formulae**, not quotations: the shahāda
and `وهو على كل شيء قدير` appear in countless hadith with no relation to any
particular ayah. At six the formulae drop out and the top matches are distinctive
verse wordings. Six is the elbow. It is a parameter (`MIN_QUOTE_WORDS`), not a
constant baked into the algorithm, and the table above is reproducible by
changing it.

The threshold also **excludes the Basmala for free**: four words normalised, so
it is never indexed. Without that it would be the most-quoted verse in the corpus
by a wide margin and would bury every real link. No special case was needed.

**3. Pure matcher in `core`, generation at build time in `data`.**
`core/src/verse-hadith.ts` holds the whole algorithm — an n-gram index over the
Qurʾān, a sliding window over each hadith, and a merge step so the reported span
is the _entire_ shared run rather than its first six words. It is pure and
deterministic (0001, 0003), so it is unit-tested directly and the same code path
produces the dataset. `packages/data/scripts/ingest.ts` gains a step that reads
the two datasets **from disk** and writes `datasets/verse-hadith-links.json`.

That step touches **no network** — unlike every other ingest step — so it can be
re-run offline whenever the matcher or threshold changes:
`pnpm --filter @ummahlibrary/data ingest -- --links-only`. It carries a coverage
guard (`< 100 ayahs` or `< 300 links` throws), mirroring the existing
`hadiths.length < 40` check: a broken normaliser would otherwise ship a silently
empty dataset and a feature that renders nothing.

**4. References in the dataset; text joined at read time.** The dataset stores
`{collectionId, number, relation, quote}` — **not** hadith text, which already
lives in `hadiths/*.json`. Duplicating it would double the payload for nothing.
`packages/api/src/related-hadith.ts` joins references to text, grouping by
collection so each file loads once. Result: **159 KB**, comfortably bundleable.

**5. A dynamic REST route, not 6,236 prerendered ones.** Only 411 ayahs have any
links, so prerendering the other 5,825 would spend most of the build writing
empty responses. `GET /api/v1/surahs/{n}/ayahs/{a}/hadith` is `force-dynamic`,
reads only bundled files, and lets `apiJson`'s cache headers absorb repeats. Both
dataset slices are added to `outputFileTracingIncludes` (AGENTS rule 5).

**6. The UI states how the link was made.** The panel mirrors the `TafsirCompare`
toggle, and each card shows the **matched span**. These links are generated, not
curated, and the panel says so: _"Matched automatically where the hadith's Arabic
repeats this āyah's words. A shared wording is not by itself a commentary on the
verse."_ A reader can see the evidence and judge it, rather than inheriting a
claim of editorial endorsement we have not made.

## Consequences

- **Good:** no new dataset, no new vendor, no new licence, no scholar review —
  the whole feature derives from two corpora already bundled and attributed. It
  works offline, like the rest of the reader.
- **Good:** the matcher is pure and in `core`, so the threshold can be retuned and
  the dataset regenerated offline in seconds (~2 s for the full corpus).
- **Cost — recall.** 411 of 6,236 ayahs carry links. Most ayahs show an empty
  state, and every _topical_ relationship is invisible. This is a deliberate
  precision-over-recall trade: the alternative is claims we cannot support.
- **Cost — a verbatim match is not an intention.** A hadith containing an ayah's
  wording is not necessarily citing it; some matches (e.g. 64:1, whose wording is
  also a well-known dhikr) are coincidences of shared formula rather than
  quotation. The threshold reduces this; the visible matched span lets a reader
  see it. We do not claim more than the coincidence.
- **Cost — corpus-bound.** Links exist only for the six ingested collections, and
  only where a collection has Arabic (4 of 34,157 hadith do not).
- **Scope:** web only. A mobile `RelatedHadith.native.tsx` over the same REST
  endpoint is a clean follow-up; the port and dataset need no change.
- **Not superseded:** ADR 0022 (hadith ingestion) is unchanged; this reads its
  output. Route A stays possible behind `VerseHadithLinkRepository` if a vetted,
  licensed mapping ever appears — that would be an implementation swap, plus a
  `needs-scholar-review` pass for the interpretive links it would introduce.
