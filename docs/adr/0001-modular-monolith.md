# ADR 0001 — Modular monolith with enforced boundaries

- **Status:** Accepted
- **Date:** 2026-06-04

## Context

Ummah Library starts as a Quran reader but is intended to grow into a full
Islamic knowledge ecosystem (Hifz, Tafsir, Hadith, Adhkar, Qibla, Zakat, …)
across web and mobile. We need an architecture that lets many contributors add
features over years without the codebase collapsing into a tangle — and without
premature microservice complexity.

## Decision

A **single TypeScript monorepo** (Turborepo + pnpm) organized as a **modular
monolith** with **ports & adapters** and a strictly enforced dependency
direction:

- `apps/*` (Next.js web, Expo mobile) may depend on `packages/*`.
- `packages/*` may **never** depend on `apps/*`.
- `packages/core` depends on **nothing** — no UI framework, no database driver.
  It holds the pure domain model, structural utilities, and **ports**
  (interfaces) such as `QuranRepository`.
- Every external concern (DB, AI, audio, storage) is reached only through an
  **adapter** that implements a core port.

The dependency chain for a feature is therefore:

```
app  →  api  →  core (ports)  ←  data / adapters (implementations)
```

## Consequences

- **Positive:** the core stays testable in isolation and framework-free
  forever; vendors and frameworks can be swapped behind adapters; new features
  are new modules against existing boundaries — no rewrites.
- **Cost:** more indirection up front (ports for things that have one
  implementation today).
- **Enforcement:** the boundary rules will be enforced in CI (Step 0.3, e.g.
  `eslint-plugin-boundaries`) so a violating import fails the build, not a code
  review.
