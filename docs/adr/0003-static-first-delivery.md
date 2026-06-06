# ADR 0003 — Static-first delivery on Next.js / Vercel (no database)

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

A Quran reader is overwhelmingly **read-only** over fixed content. We want it
fast, cheap, offline-capable, and operationally simple — ideally with no database
to run, back up, or scale. The data set is known at build time.

## Decision

**Prefer build-time generation; a runtime function is the exception.**

- The web app (`apps/web`, Next.js App Router) **statically generates** every page
  it can via `generateStaticParams`: all 114 surahs, 30 juzʾ, and the REST
  endpoints (see 0004) as static JSON (`export const dynamic = "force-static"`).
  This yields ~950 prerendered routes served from the CDN.
- It is an **installable PWA** with a service worker (`public/sw.js`): static
  assets cache-first, navigations network-first with cache fallback, so visited
  surahs read **offline** (0006 covers user state).
- **No database.** The genuinely dynamic endpoints — tRPC, the single-ayah
  endpoint, and runtime-fetched tafsir/hadith (0005) — are the only server
  functions. Those that read the local datasets at runtime ship them with the
  function via Next's `outputFileTracingIncludes`, and the data adapter resolves
  the datasets dir through a **multi-candidate path resolver** that works in both
  the build and the flattened serverless layout.
- Workspace packages are consumed as **TypeScript source** (`transpilePackages`),
  not pre-built, so there is no build-ordering dance.

## Consequences

- Cheap, fast, CDN-cached, offline-friendly; the build does the data work once.
- Runtime data access without a DB is solved, at the cost of the tracing config
  and the path resolver (documented where they live).
- Heavily dynamic or personalized server features (e.g. accounts, AI) will need a
  deliberate addition — they don't fit the static default and should get their own
  ADR.
