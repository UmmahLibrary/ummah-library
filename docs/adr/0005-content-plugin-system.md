# ADR 0005 — Content plugin system

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

The library grows by adding **content**: translations, reciters, tafsirs, hadith
collections — eventually many, in many languages. Adding one must not require
touching core or app code, and ideally a non-coder (a translator, a volunteer)
can contribute one. Different content also arrives differently: a translation is
small enough to bundle; a full tafsir or hadith collection is far too large.

## Decision

A **declarative plugin** is a small JSON manifest in `packages/data/plugins/`
describing one piece of content. The contract and a pure `PluginRegistry` live in
`core/plugins.ts`; the ingest validates manifests and emits `datasets/plugins.json`.

Content is delivered in one of **three modes**, chosen per kind:

- **ingested** — fetched at build, written to `datasets/`, bundled (translations).
- **runtime-json** — fetched per-surah at runtime from a URL template (tafsir,
  hadith). Large, so never bundled.
- **runtime-audio** — a per-ayah audio URL template (reciters).

Adapters in `@ummahlibrary/adapters` implement the repository ports per mode
(`HttpTafsirRepository`, `HttpHadithRepository`, …); the registry maps an id to
its manifest.

## Consequences

- **Adding content is adding a JSON file**, then re-running the ingest — no core
  or app changes. Documented in [`docs/plugins.md`](../plugins.md).
- The system already spans four kinds (translation, reciter, tafsir, hadith) and
  is open to more.
- Large content stays off the bundle (fetched on demand, online); per-content
  **licensing and scholar review** are still required before release (0002).
