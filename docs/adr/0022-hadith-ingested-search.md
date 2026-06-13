# ADR 0022 — Hadith ingested at build time, searched on the client

- **Status:** Accepted
- **Date:** 2026-06-13
- **Supersedes:** the runtime, per-section hadith delivery (the `HttpHadithRepository`
  wiring; the online-only stance of [0011](0011-translation-catalog-runtime.md) as
  applied to hadith).

## Context

Hadith was fetched **one book at a time at runtime** from an external CDN
(`fawazahmed0/hadith-api`). That made the page slow and fragile (it hangs on a
live fetch, and fails offline), carried only English text + grade + reference,
and — crucially — could not be **searched**, which is the whole shape of the
Noor Hadith design. Unlike the ~490-edition translation catalogue that justified
runtime fetch (0011), hadith is a **bounded corpus** (six collections, ~34k
hadith, ~20 MB English / ~5 MB compressed) — well within build-time ingestion.

## Decision

**1. Ingest the collections at build time** (the Quran-data pattern, 0002).
`packages/data` downloads each English edition once, normalizes to our `Hadith`
shape (keeping every grader's grade) and writes
`datasets/hadiths/{id}.json` with source attribution — never hand-edited.

**2. Serve from the datasets through the port.** A new `FileHadithRepository`
(in `data`) implements the `HadithRepository` port — `getSection` now reads the
local data (no external fetch), and a new `getCollection` returns a whole
collection. A `force-static` `GET /api/v1/hadith/[collection]` prerenders each
collection so it's a cached static file.

**3. Search on the client.** The Hadith page lazily fetches the static
per-collection files and **background-prefetches** the rest (cached, one-time
~5 MB, then offline), ranking with `core`'s pure `searchText` and filtering by
**book** and **grade**. No search service, no client bundle weight beyond the
data it actually loads.

**4. Grades are a pure, reviewable category.** Bukhārī & Muslim are `sahih` by
consensus (the source leaves them ungraded); the Sunan use the source's
per-grader grades, reduced to a coarse `sahih | hasan | daif` key by
`hadithGradeCategory` in `core` (al-Albānī preferred). The full grade strings
stay on each hadith for transparency.

## Consequences

- **Good:** instant, **offline**, reliable hadith with real cross-collection
  search + grade filters — the design's experience — reusing pure `core` logic.
  The external runtime dependency is gone.
- **Cost:** ~19 MB of generated datasets in the repo (the static-first trade,
  0003); the client downloads ~5 MB (compressed) once for global search.
- **Scholar review:** ingested translations and the derived grade categories are
  Islamic content — this ships `needs-scholar-review`.
- **Limits / follow-ups:** English only (Arabic editions are ~40 MB more — a
  deliberate follow-up); the source has **no narrator/topic fields** (the
  narrator is embedded in the text), so the design's "Browse by topic" chips and
  Arabic card text are deferred. `HttpHadithRepository` is kept as a valid
  online adapter (e.g. for an online-only deployment) but is no longer wired.
