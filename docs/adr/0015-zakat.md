# ADR 0015 — Zakat calculator: the agreed monetary core, choice-points exposed

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

A zakat calculator is the fourth Phase 6 module
([epic #27](https://github.com/UmmahLibrary/ummah-library/issues/27)). Unlike
prayer times, qibla and the Hijri calendar — pure astronomy/arithmetic — zakat
touches **fiqh**, which normally puts it behind our `needs-scholar-review` gate
(AGENTS.md). Two things shape the decision:

1. **Most of zakat al-māl is not actually disputed.** Research across the major
   calculators (Islamic Relief, National Zakat Foundation, Zakat.org, Muslim Aid,
   IRUSA) shows they converge on one model: sum zakatable *monetary* assets
   (cash, gold, silver, investments, business stock, receivables), deduct
   immediate liabilities, and pay **2.5%** if the result has stayed above the
   **niṣāb** for a lunar year. The four Sunni schools agree on this. (Note:
   quran.com and similar readers do **not** ship a zakat tool — the charities
   do.)
2. **The real variation is narrow and nameable:** the **gold vs. silver niṣāb**
   basis (matters only when wealth sits between the two thresholds); a few edges
   (Hanafi counts personal jewelry; pensions/mixed assets); and wholly separate
   systems — agricultural/livestock zakat (different rates and tables) and **Shia
   khums** (a 20% levy, not zakat).

## Decision

**1. Encode only the agreed monetary mechanics, in pure `core`.** `core/zakat.ts`
holds the constants (`ZAKAT_RATE`, `NISAB_GOLD_GRAMS` 87.48, `NISAB_SILVER_GRAMS`
612.36), the asset-category catalogue, `nisabValue`, and `calculateZakat`. Pure
and unit-tested; no vendor, no port — like the other Phase 6 maths modules.

**2. Expose the genuine choice-point instead of taking a position.** The niṣāb
basis is a **user toggle** (defaulting to silver, the common charity default),
exactly as the Hijri page exposes its day adjustment ([0014](0014-hijri-calendar.md)).
We do not silently encode a contested ruling.

**3. Scope out what we can't compute neutrally, in plain language.** The UI states
it is *an educational estimate, not a fatwa*, limited to monetary zakat, and
explicitly excludes agriculture, livestock and khums, directing edge cases to a
qualified scholar.

**4. Metal prices are a user input, keeping it offline.** The user enters the
current gold/silver price per gram; the niṣāb is derived in `core`. No metals-API
dependency. **Trigger:** if a live price feed is wanted later, add it behind a
small port (an adapter), leaving the `core` calculation untouched.

**5. Shipped without scholar review, by explicit owner decision.** The repo rule
is to tag Islamic content `needs-scholar-review`; the owner has chosen to release
this now without a reviewer (none is currently available). This ADR records that
deviation so it is visible, not hidden. The mitigations are the deliberately
agreed-only scope, the exposed choice-point, and the on-page disclaimer. **Open
follow-up:** have a scholar review the wording, the niṣāb defaults, and the
liability/asset definitions; revisit jewelry and pension handling then.

## Consequences

- **Good:** a useful, fully offline, local-first calculator (inputs persist in
  `localStorage` as `ul.zakat`, nothing leaves the device), built only on the
  settled core and shareable with mobile through `core`.
- **Cost / risk:** without a reviewer, responsibility for the fiqh wording rests
  on the agreed-scope discipline and the disclaimer; the follow-up review above
  remains outstanding. The calculator intentionally cannot answer agricultural,
  livestock, khums or unusual-asset cases.
