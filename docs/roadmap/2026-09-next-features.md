# Next features — research & plan (2026-09-03)

A survey of where Ummah Library actually stands, what the tracker says it stands
at (the two have drifted), and what I'd build next and in what order.

Method: read all 40 ADRs, the 18 open issues + the two epics, the QA log and the
Lighthouse audits, then **verified each claim against the code** rather than
trusting the tracker. Several "open" items turned out to be shipped, and two
significant gaps turned out to be tracked nowhere at all.

---

## 1. Where the project actually stands

The product is **mature and broad**. Forty ADRs, all Accepted. The reader
(3 surfaces, ~490 translations, multi-tafsir, word-level audio + timings),
Hadith (6 collections **with Arabic**), Hifz (SM-2 + analytics + hide/peek),
the full worship-tracker suite (prayer, qaḍāʾ, ḥayḍ, fasting-qaḍāʾ, sunnah
fasts), prayer times + reminders, qibla, Hijri, zakat, adhkar, duʿās, tasbih,
reading plans & goals, achievements, mosque finder, offline reciter audio,
an engineering blog, E2EE sync (through v3), a mobile app, and an extension —
all shipped.

### The tracker has drifted from the code

Epic **#152** (Phase 8) shows Tier 1 and Tier 2 almost entirely unchecked. In
fact **every one of those items is shipped and its issue closed**:

| Epic item                     | Reality                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| #134 hide/peek                | `core/src/peek.ts` ✅                                                             |
| #135 hifz analytics           | `core/src/hifz-analytics.ts` ✅                                                   |
| #136 speed + A–B repeat       | `core/src/audio.ts` — `PLAYBACK_SPEEDS`, `repeatRange` ✅                         |
| #139 sunnah fasting           | `core/src/sunnah-fasting.ts` ✅                                                   |
| #140 extended prayer times    | `core/src/prayer.ts` — `SUPPLEMENTARY_TIMING_NAMES` (imsak/midnight/lastThird) ✅ |
| #141 tafsir compare           | `apps/web/src/components/TafsirCompare.tsx` ✅                                    |
| #143 islamic events           | `core/src/islamic-events.ts` ✅                                                   |
| #144 / #145 / #150 word layer | ADR 0036, `RecitationTimingRepository` ✅                                         |
| #148 mosque finder            | ADR 0038, `/mosques` + `MosqueFinderScreen` ✅                                    |

**Genuinely still open from that epic:** #146, #147, #149, #151 — plus the
2026-06-30 additions #200–#204, and the carry-overs #33, #37, #80.

Two open issues are also effectively **done but never closed**: **#202**
(offline reciter audio — ADR 0039 Accepted, `/downloads` on both platforms) and
the infrastructure half of **#208** (i18n — ADR 0040 Accepted).

> **Action before anything else:** tick the epics, close #202, and re-scope #208
> to the rollout (below). Ten minutes of tracker hygiene stops the next planning
> pass from re-deriving all of the above.

---

## 2. The two gaps nobody is tracking

These are the highest value-per-effort work available, and neither has an issue.

### A. Web accessibility — audited, fixed, and now gated

> **Corrected 2026-09-03, after the work landed.** This section originally
> asserted, on the strength of the June Lighthouse sweep, that four findings were
> still live across 23–29 routes and that every icon-only button in the app was
> unlabelable. **That was wrong**, and wrong for a specific reason worth
> recording: the measurements behind it were line-scoped `grep`s, which cannot
> see a JSX attribute that sits on the following line. Most of those selects and
> buttons _were_ labelled. An axe run settled it properly.

**What the axe re-audit (WCAG 2.1 A/AA, 28 routes) actually found.** Of the five
June findings, one had been fixed earlier (the contrast token), three were not
reproducible (`link-text` — `TabBar.tsx` already carries an `aria-label`;
`button-name`; `label-content-name-mismatch`), and one was still live
(`select-name`, the blog tag filter).

It also found **two real defects Lighthouse never reported**:

1. **`/profile`, 8 nodes.** Not the token: locked achievement cards carried a
   card-wide `opacity: 0.55`, blending the "Locked" caption to **2.32:1**. Fixed
   by dimming only the decorative glyph.
2. **`/surah/2` and `/juz/1`, 434 nodes.** The translation loading skeleton was
   `<p aria-busy aria-label>`; ARIA prohibits `aria-label` on a bare `<p>`, so the
   label was invalid on every skeleton. Fixed with `role="status"`. It only
   appears while translations are in flight — which is exactly why a single
   hand-run audit missed it, and why the gate matters more than the fixes.

**Shipped:** those fixes, plus `ariaLabel` on `Btn` (web + native) and `Seg` —
`Btn` genuinely had no way to name an icon-only button, which was a real latent
API gap even though few call sites hit it today — and `e2e/a11y.spec.ts`, which
asserts zero WCAG A/AA violations across 28 routes. **Result: 28/28 clean.**

**The transferable lesson:** the June audit's value decayed silently because
nothing re-ran it. Six weeks later nobody could say which findings still stood,
and a plan built on it inherited the error. The gate, not the fixes, is the part
that keeps paying.

### B. i18n is announced but ~2% delivered

ADR 0040 is Accepted and the infrastructure is good: typed catalogue,
compiler-enforced completeness, `<html dir>` RTL, a locale picker, Urdu as the
proving locale, and parity runtimes in mobile + extension.

But the **rollout never happened**:

- `apps/web/src/i18n/messages.ts` holds roughly **52 keys** — the nav shell and
  common chrome, exactly the "starter slice" the ADR scoped.
- **3 of 174** web `.tsx` files consume `t()`.

So a reader who switches to Urdu gets a right-to-left layout wrapped around an
almost entirely **English** app. That is arguably worse than not offering the
locale, and it is the gap most likely to be noticed by the Urdu-speaking audience
the project explicitly courts (Urdu locales already default to an Urdu
translation).

**Plan** — incremental, no architecture change (the ADR says as much):

1. Sweep screen by screen, highest-traffic first: reader → prayer times →
   settings → tools hub → hifz → trackers.
2. Add a **lint rule or test that fails on new hardcoded JSX text** in swept
   directories, so the rollout ratchets instead of drifting back.
3. Close out the two deferred ADR 0040 items: the **pre-hydration locale script**
   (kills the RTL flash — the theme already solves this exact problem, copy it)
   and **native RTL** (`I18nManager.forceRTL`, which needs a reload mechanism).
4. Re-open the `packages/i18n` question only once two platforms genuinely
   duplicate the same keys — the ADR deferred it deliberately; don't pre-empt it.

Flag the Urdu strings `needs-scholar-review` as ADR 0040 already does.

---

## 3. The one new feature that just became unblocked

### #200 — Related hadith for an ayah (via the quotation index)

This was the 2026-06-30 sweep's **#1 untracked gap**, and it has been sitting
blocked. It isn't blocked any more, and the issue doesn't know it.

The issue offers two routes. Route **(A)**, ingesting a ready-made verse↔hadith
mapping, remains genuinely blocked — its own research concludes "no broad,
cleanly-licensed, ready-made verse↔hadith list is known to exist," and every
candidate is either benchmark-scale, restrictively licensed, or derived (which
would need scholar review we don't have).

Route **(B)** — link a hadith to a verse only when the hadith **verbatim quotes**
it — was blocked on **#52** (Arabic hadith editions), because the English text
contains no Arabic Quran quotations to detect.

**#52 closed 2026-08-09 via PR #212.** Verified in the data:
`packages/data/datasets/hadiths/eng-bukhari.json` carries **7,580 of 7,580**
hadith with a populated `arabic` field. The blocker is gone.

Route B is now the best-shaped feature on the board:

- **No new dataset, no new vendor, no new license.** Both corpora are already
  bundled and already attributed.
- **No scholar review.** A verbatim quotation is a factual match, not an
  interpretation — precisely the distinction the repo's own policy draws.
- **Reuses existing pure code.** `core/src/search.ts` already exports
  `normalizeForSearch`, the tashkeel-insensitive Arabic normalisation this needs.
- **Fits the architecture unchanged.** The issue already specifies the shape:
  `VerseHadithLinkRepository` port + `HadithLink` entity in `core`, a pure
  `verse-hadith.ts` matcher, a build-time ingest producing
  `verse-hadith-links.json` with a coverage guard, tRPC + REST, and a "Related"
  panel mirroring the existing `TafsirCompare` toggle in `AyahActions.tsx`.
- **Static-first.** A bundled mapping prerenders; nothing new at runtime.

**Engineering care points**

- Match on **normalised, tashkeel-stripped** Arabic with a minimum span length so
  short common phrases (basmala, `قال الله تعالى`) don't produce noise; tune the
  threshold against a held-out sample and record the chosen value in the ADR.
- Hadith commonly quote a **fragment** of an ayah — substring matching against
  each verse, not whole-verse equality.
- Emit `relation: "quotes"` only. Leave `"topical"` in the type for a future
  vetted mapping, but ship nothing under it.
- The ADR (AGENTS rule 6) records the new "content link" delivery mode **and**
  why route B was chosen over A. Keep A's port compatible so a vetted mapping can
  drop in later without a redesign.

**Update the issue** to record that #52 unblocked (B), so the next person doesn't
re-litigate the sourcing question.

---

## 4. Everything else, and why it waits

### Ready, but behind the three above

- **#204 translation audio (Urdu/English)** — genuinely near drop-in: everyayah
  hosts per-ayah translation audio in the _same_ numbering, so it's the existing
  reciter manifest shape with a different template and a non-Arabic `language`.
  Pairs with the shipped #136 (speed/A–B) and #202 (offline download, same
  per-ayah file model). Real work is the play-queue model (Arabic-only /
  translation-only / interleaved) and per-set license verification. **Strong
  candidate right after #200**, and disproportionately valuable to the same
  Urdu audience as the i18n rollout.
- **ADR 0039 mobile verification** — the ADR states the mobile offline-audio path
  is implemented but **never exercised on a device or simulator**. A manual
  airplane-mode pass is recommended before release. Cheap, and it's the last
  thing standing between #202 and closure.

### Gated on a decision, not on engineering

- **#33 tajweed** — licensing is _solved_ (`cpfair/quran-tajweed` data is CC-BY
  4.0, verified against the README). Three real gates remain, none of them legal:
  a **product call** on shipping _computed_ rule spans vs holding out for a
  scanned authoritative mushaf; **index alignment** (their offsets target a
  pinned ~2017 Tanzil snapshot, ours is almost certainly different — colours
  would land on the wrong characters); and **~5.58 MB** of bundle against
  AGENTS' lean-against-large-content rule. Needs a maintainer decision first.
- **#201 mobile widgets** — best _constraint_ fit on the board (pure-local, no
  backend, reuses verse-of-day + `nextPrayer` + streak). But it needs native
  prebuild work on two platforms and **cannot be verified without devices**,
  which this environment lacks. Schedule it when device access exists.
- **#146 topics/similar-ayah, #147 morphology, #151 Lane's Lexicon** — each needs
  per-resource license verification first (QUL grants are per-resource; never
  assume blanket MIT). #147/MASAQ (CC-BY 3.0) is the cleanest of the three and
  the natural first.

### Blocked, correctly

- **#37 vocab flashcards** — mechanics are unblocked, but every turnkey English
  gloss set is NC-ND or legally dubious. Parked pending the permission request
  (TarteelAI/quranic-universal-library#638) or a scholar collaborator.
- **#80 page-faithful mushaf** — KFGQPC/QCF font terms unvetted against AGPL.
- **#203 Asbāb al-Nuzūl** — in scope only via a licensed, attributed,
  scholar-reviewed edition.
- **#26 AI features** — needs the scholar board the epic itself names.
- **#115 iOS App Store** — needs an Apple developer account, not code.
- **#149 AR qibla** — needs a device.

---

## 5. Recommended sequence

| #   | Work                                                                                            | Why here                                                     | ADR?    |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| 0   | Tracker hygiene — tick #152/#38, close #202, re-scope #208, note #52 on #200                    | 10 min; stops repeated re-derivation                         | no      |
| 1   | ~~**Web a11y**~~ — **done 2026-09-03**: 2 real defects fixed, `ariaLabel` added, axe gate 28/28 | Was a defect, not a feature; the gate is what keeps it fixed | no      |
| 2   | **i18n rollout** (#208) + pre-hydration locale script                                           | Finishes an announced feature that's ~2% delivered           | no      |
| 3   | **#200 related hadith**, route B                                                                | Newly unblocked; no new data, license or review              | **yes** |
| 4   | **#204 translation audio**                                                                      | Near drop-in on an existing model; same audience as 2        | maybe   |
| 5   | ADR 0039 mobile airplane-mode pass → close #202                                                 | Last step to closure                                         | no      |

Items 1 and 2 are deliberately ahead of every new feature. The product's breadth
is already its strength; the weakest thing about it right now is that two of the
things it _advertises_ — an accessible interface and a localized one — aren't
really there yet. Shipping a seventh tracker before fixing those trades depth for
a longer feature list.

Item 3 is the first genuinely new feature, and it's chosen because it is the only
one whose blocker has actually cleared.

---

## 6. Invariants any of this must respect

Restated from AGENTS.md, because most of the above touches `core` or `data`:

- `core` imports nothing; no clock, no I/O — inject both.
- Everything external goes behind a port in `core/src/ports.ts`.
- Never hand-edit `packages/data/datasets/` — change `scripts/ingest.ts`.
- Static unless it can't be; a runtime function reading datasets needs
  `outputFileTracingIncludes`.
- Design tokens and primitives live in `packages/ui` only — which is exactly why
  the a11y fix belongs there and not in the app.
- An architectural change ships its ADR in the same commit.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every commit.
