# ADR 0025 — Reading plans: a pure schedule engine, catalogue bundled in core

- **Status:** Accepted
- **Date:** 2026-06-15

## Context

Readers want structured journeys through the Quran — finish in Ramaḍān, read
Juzʾ ʿAmma, complete the whole muṣḥaf by a date they pick. This spans two needs:
**preset** plans (a fixed cadence, e.g. a juzʾ a day) and **custom** plans (pick
an end date, or N pages a day, and have the app compute the pace). It must work
**offline on web and mobile** and, like everything else, stay local-first with no
accounts (ADR 0006).

## Decision

**A pure schedule engine in `core` (`reading-plans.ts`).** Plan _templates_ (a
reusable catalogue entry) are separated from a reader's _active plan_ (a started
template + start date + a linear `unitsRead` cursor). A plan covers an ordered
list of units — juzʾ / ḥizb / page / sūrah / ayah, converted via the existing
`quran-structure` invariants — paced by one of two strategies: `fixed` (a set
cadence) or `targetDate` (a chosen finish date). Both are spread by an even
cumulative distribution (`cum(d) = ⌊d·total / days⌋`) so a target-date plan
finishes on or before its date. Everything is deterministic and unit-tested; the
clock is injected (a `today` string), never read inside `core`.

**The catalogue is bundled in `core`, not `packages/data`.** The small curated
templates are shared offline by both apps the same way the Duʿās are — straight
from `core` — because **mobile cannot import `packages/data`** (it pulls in
`node:fs`, which Metro can't bundle). A `PlanCatalogPort` plus a thin
`BundledPlanCatalog` adapter in `packages/data` re-serve the list so the API (and
any future remote catalogue) depend only on the port. This is a deliberate
exception to "content lives in `data`", justified by the offline-on-mobile
constraint.

**Progress is local-first device state behind the `PlanStore` port** (ADR 0024):
one active plan at a time, persisted under `ul.readingPlan` and carried by the
key-agnostic backup (ADR 0018). The public API therefore exposes **only the
catalogue** (read-only `listPlanTemplates` / `GET /api/v1/plans/catalogue`);
there are no server plan mutations, because there is no server-side user state —
starting, advancing and re-pacing all happen client-side.

## Consequences

- **Good:** one engine drives presets, custom target-date plans, and the
  re-pace/catch-up maths (`reschedule`, `daysAheadBehind`, `projectedFinish`); it
  works offline on both platforms; catalogue and progress are each swappable
  behind a port, so cross-device sync (Phase 4, #25) becomes an adapter swap.
- **Cost:** the catalogue sits in `core` rather than `data` (the documented
  exception above); and `core` labels are number-based ("Sūrah 78") because
  `core` can't import the names dataset — apps prettify them.
- **Scope:** this records the model. The catalogue / custom-plan UI, the progress
  detail view, reader auto-advance, the re-pace UX, reminders and the share card
  are follow-ups (#67–#71); mobile parity is #64.
