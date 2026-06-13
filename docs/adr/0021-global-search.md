# ADR 0021 — Global search: one client index over several sources

- **Status:** Accepted
- **Date:** 2026-06-13

## Context

Search was Quran-only (full-text over the Arabic corpus + an English
translation). The Noor design is **one search across the Quran, the 99 Names,
adhkār and more**, with type-filter pills and per-source result cards. The
question is how to make search multi-source without a backend search service
(we are static-first, 0003) and without shipping dead UI.

## Decision

**1. Reuse the pure core ranker.** `core`'s generic `searchText<T extends {
text: string }>` (accent/diacritic folding, AND-token scoring) already ranks any
list of items with a `text` haystack. The multi-source search is just a bigger
index fed to the same function — no new ranking logic, and `core` stays pure.

**2. Build one unified index on the client, from data we already serve.** The
web composes the index from existing endpoints — the Quran Arabic corpus
(`/api/v1/search/corpus`) + an English translation (CDN, as before), surah
metadata, the **99 Names** (`/api/v1/names`) and the **adhkār**
(`/api/v1/adhkar`). No new bundle: these are already shipped. Index building is
resilient — any one source failing (e.g. the offline English CDN) just drops
that slice. Results are colour-coded by type, with filter pills that only appear
for types that have matches.

**3. Hadith is deferred, and links out.** Hadith text is large and fetched
per-collection at runtime ([0011](0011-translation-catalog-runtime.md)), so it
can't be folded into a client index the way the Quran/Names/adhkār can. The
empty-state "Search across" card opens the Hadith page instead of pretending to
index it. **Trigger to revisit:** a server-side search index would let hadith
(and full multi-edition translations) join the same result list.

**4. The empty state is index-independent.** Recent searches, topic chips and
the "Search across" cards render immediately; the index loads in the background
and a pending query re-runs once it's ready (no more "Building the index…" wall).

## Consequences

- **Good:** one honest, multi-source search that reuses pure `core` logic and
  ships **no new payload** — it indexes data the app already serves. Filters are
  truthful (only shown when populated).
- **Limit:** hadith isn't full-text searchable on the client, and English ayah
  text depends on the CDN (Arabic, Names and adhkār come from local API routes).
  Both are the static-first trade-off, revisited only if we add a search service.
