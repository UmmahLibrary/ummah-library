# Manual E2E QA — Round 47 (2026-11-23)

Follow-up from round 46: what the reader shows when a recitation can't play at
all (offline without a download, a failed or unsupported stream).

## Findings

### 1. A recitation that failed to load did nothing, silently — FIXED

- **Where:** [ReadingAudio.tsx](../../apps/web/src/components/ReadingAudio.tsx),
  new `dock.cantPlay` string in all six catalogues
- **Symptom:** with playback failing, pressing Play in the reader dock (or ▶ on
  an āyah, or the Juzʾ player) just left the button as it was — no message,
  no hint that saving the surah for offline would help.
- **Root cause:** `audio.onerror` and a rejected `audio.play()` both went
  straight to `stop()`; a thrown timing fetch was an unhandled rejection.
- **Fix:** those paths now call `fail()` → the dock status reads "Couldn’t
  play — check your connection, or save this surah for offline" (error colour)
  and a dedicated `role="status"` region announces it once. A blocked autoplay
  (`NotAllowedError`) or an interrupted load (`AbortError`) stays silent, as
  before; the message clears on the next successful play.
- **Verification:** live on Al-Ikhlāṣ with playback forced to fail: one real
  click on the dock's Play → the message appears in the dock.
- **Regression tests:** two cases in
  [ReadingAudio.test.tsx](../../apps/web/src/components/ReadingAudio.test.tsx)
  (failure is reported; blocked autoplay isn't).

## Investigated, no bug found

- Downloaded (offline) audio still plays from the local blob first; the failure
  path is only reached when neither a local copy nor the stream works.

## Verification

- Web `tsc` clean; prettier clean; ReadingAudio and i18n tests pass (catalogue
  completeness covers the new key).

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
