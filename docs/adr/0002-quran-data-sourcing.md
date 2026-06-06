# ADR 0002 — Quran data: sourcing, reproducible ingestion, licensing

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

The app needs authentic Quran text, structure, and translations. Three forces
shape the choice: **authenticity** (this is sacred text — it must be correct and
attributed), **licensing** (the project is AGPL-3.0, so bundled content must be
freely redistributable), and **reproducibility** (no one should wonder where a
byte came from or hand-fix data).

## Decision

- **Arabic + structure** comes from **[Tanzil](https://tanzil.net)** (Uthmani
  text, **CC-BY 3.0**) and its `quran-data.xml` (surah metadata, juzʾ, hizb,
  pages). The standard Kufi counts (114 surahs, 6236 ayahs) live in `core` as the
  single source of truth; the ingest cross-checks against them.
- **Translations** are ingested from
  **[fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api)** into
  versioned JSON. **Saheeh International was deliberately excluded** — its license
  does not permit free redistribution under AGPL.
- A single **reproducible ingestion script** (`packages/data/scripts/ingest.ts`,
  `pnpm --filter @ummahlibrary/data ingest`) downloads, validates (114/6236), and
  writes `packages/data/datasets/`. **Generated files are never hand-edited.**
- The **Basmala** that Tanzil prepends to each surah's first ayah is lifted out
  into per-edition metadata (`hasBismillah`), so ayah text is pure and aligns 1:1
  with translations (handling the waṣl form in surahs 95/97).
- **Attribution travels with the data** (`packages/data/ATTRIBUTION.md`).

## Consequences

- The dataset is verifiable, attributed, and regenerable from source.
- Large content (tafsir, hadith) is **fetched at runtime** rather than bundled
  (see 0005); only the comparatively small translations are ingested.
- Adding/replacing a translation is a manifest change (0005) + a re-ingest; each
  must have its redistribution terms confirmed and is scholar-reviewed before
  release.
