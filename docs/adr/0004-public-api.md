# ADR 0004 — Public API: static REST/OpenAPI + typed tRPC

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

Two different consumers want the data: **third parties** (who want a plain,
cacheable, language-agnostic HTTP API) and **our own TypeScript apps** (web server
components and the Phase-3 mobile app, which want end-to-end type safety). Both
must read through the same domain logic, not a parallel one.

## Decision

Expose **two surfaces over the same core ports** (0001):

- **REST under `/api/v1`** is the **public contract**: plain JSON, **open CORS**,
  prerendered as static files where possible (0003), with an **OpenAPI document**
  at `/api/v1/openapi.json`. Endpoints: surahs, single surah/ayah, editions,
  translations, plus runtime tafsir/hadith.
- **tRPC** (`/api/trpc`) is the **typed surface**. The `AppRouter` type is exported
  from `@ummahlibrary/api` so TypeScript clients get inferred, checked calls
  (this is the type the Expo app shares — 0009).

Both call the repositories in `@ummahlibrary/api`; neither re-implements logic.

## Consequences

- REST is cacheable/static and consumable by anyone; tRPC gives our own code type
  safety without hand-written client types.
- Two surfaces to keep in step — acceptable because they're thin and share the
  repositories. The REST shapes are the stable public contract; tRPC can evolve
  with our clients.
