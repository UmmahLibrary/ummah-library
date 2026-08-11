# 0041 — Translation-audio recitation per verse

- **Status:** Accepted
- **Date:** 2026-08-11
- **Issue:** #204

## Context

Reciter audio (ADR 0005) is Arabic-only. Non-Arabic-speaking readers — especially
Urdu and other audiences who follow the meaning by ear — have no way to *hear*
the translation; they can only read it. everyayah.com, the same host our
Arabic reciters already stream from, also hosts per-ayah recordings of spoken
translations, in the identical `{surah:3}{ayah:3}.mp3` naming scheme. Verified
directly (not taken on faith from the issue): `everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/`
and `everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/` both exist
and serve correctly-named per-ayah files today.

## Decision

**A new plugin kind, `translation-audio`** (`packages/core/src/plugins.ts`),
rather than a `role` field on the existing `ReciterPlugin`. The two were both
options on the table; a distinct kind wins because every existing
`pluginRegistry.byKind("reciter")` call site (the web reciter pickers, the
mobile `RECITERS` list, the offline-downloads manager) keeps meaning exactly
"Arabic reciters" with **zero filtering required anywhere** — a `role` field
would have required auditing and updating every one of those call sites to
exclude translation voices, a much larger and more error-prone change for the
same outcome.

`TranslationAudioPlugin` shares `ReciterPlugin`'s `audioUrlTemplate` shape, so
`reciterAudioUrl()` and `downloadSurahAudio()` (#202) were **widened to a
structural `{ audioUrlTemplate }` / `{ id, audioUrlTemplate }` parameter**
instead of literally `ReciterPlugin` — both plugin kinds satisfy it, so a
translation voice is downloadable for offline listening through the exact same
`AudioStore` adapters with no new code.

**Playback queueing** is a new pure helper, `buildPlayQueue()`
(`packages/core/src/audio.ts`): given a verse list and a
`TranslationPlayMode` (`"arabic-only" | "interleaved" | "translation-only"`),
it expands the list into an ordered `{ verse, source }[]` queue.
`"arabic-only"` is a lossless 1:1 passthrough, so the default mode changes
**nothing** about existing playback — this is what let the web player's
`play()` be rewritten around an explicit queue+index instead of the previous
"re-derive my position by searching the list for a matching verse" logic
(which becomes ambiguous the moment the same verse can appear twice in a row,
as it does in interleaved mode) without behaviour drift in the common case.

**Player changes** (`apps/web/src/components/ReadingAudio.tsx`):

- `play(queue, idx, atEnd)` replaces the old `play(verse, advance)` — `atEnd`
  (`"stop"` vs `"repeatOrLoop"`) governs only what happens once the queue is
  exhausted (a single tapped āyah always just stops, even mid a 2-item
  interleaved pair, matching the old `advance: false` exactly; a whole-list or
  A→B-range play consults the repeat countdown / loop toggle, as before).
  Advancing from one queue item to the next is now unconditional and uniform —
  the same mechanism carries an interleaved pair's Arabic→translation step and
  a plain reciter's verse-to-verse step.
- Translation audio carries **no word-level timing** — `segments` is always
  `null` for a `"translation"` queue item, so the existing highlighting code
  simply no-ops for it without a dedicated branch.
- A missing translation-audio file (a gap in everyayah's coverage) **skips
  gracefully** to the next queue item via `onerror`, instead of stopping
  playback outright — scoped to `source === "translation"` only, so an Arabic
  reciter error keeps its existing hard-stop behaviour unchanged.
- A play-mode button (globe icon, cycles the three modes) plus a voice
  `<select>` — shown only once a mode past `"arabic-only"` is active, and only
  as a `<select>` when more than one voice exists (a single voice shows as a
  plain label) — surface "which translation this is" via the voice's own
  descriptive `name`, e.g. *"Ibrahim Walk (Saheeh International)"*, rather than
  a cross-reference to a bundled text edition.

**No `translationEditionId` is set on either shipped voice.** Neither Ibrahim
Walk's nor Shamshad Ali Khan's exact source text is confirmed to match one of
our bundled translation editions (`packages/data/plugins/translations/`) —
Ibrahim Walk reads Saheeh International specifically, which isn't one of our
bundled editions today. Guessing a match would misattribute the audio to the
wrong printed text, so the field (present on the type, per the issue's own
"optional" framing) stays unset for now; the voice's `name` carries the
description instead.

**Scope: web only**, per the issue's own "web first; mobile follow-up
acceptable." `apps/mobile`'s hardcoded `RECITERS`/`plugins.ts` (mobile can't
import `packages/data`) is untouched — a mobile translation-audio picker is a
follow-up under #204, not this change.

## Consequences

- **Good:** reuses everything #202 already built (the `AudioStore` port, the
  download orchestration, the Cache API adapter) for translation voices with
  no new persistence code; the interleave/translation-only mechanism is a pure,
  fully unit-tested function independent of any DOM/Audio API.
- **Cost:** `play()`'s advance logic changed shape (queue+index instead of
  list+re-search) — a real, if carefully-scoped, rewrite of already-shipped
  playback code. Mitigated by `buildPlayQueue("arabic-only")` being a lossless
  wrapper and by keeping every non-interleaved code path (single-āyah tap,
  whole-list play, A→B range) structurally the same as before, just queue-based.
- **Not done here:** a dedicated "download this translation voice" UI action —
  the existing download button still targets only the selected Arabic reciter,
  to avoid a state-tracking bug where downloading Arabic first would disable
  the button before a translation voice could ever be downloaded. Offline
  translation audio is reachable today only if a future change extends the
  download flow explicitly.
- **Verification:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  all green, including new tests for `buildPlayQueue` (core) and the
  play-mode/voice-picker UI (`ReadingAudio.test.tsx`, via React Testing
  Library's synthetic events). A real dev-server session confirmed the picker
  renders with correct voice names, mode-cycling updates state and persists to
  `localStorage`, and a play attempt reaches and successfully completes the
  real `/api/v1/recitations/.../timings` fetch `play()` makes — but
  click-driven browser automation in that session proved unreliable partway
  through (confirmed independently: a trivial, entirely pre-existing, unrelated
  toggle button also stopped responding to automated clicks), so **actual
  audible playback and queue-advance-on-`ended` were not conclusively observed
  end-to-end**. A manual smoke test (open a surah, pick a translation voice,
  hit play, confirm Arabic→translation alternation and that the ayah highlight
  advances) is recommended before merge.
