# Manual E2E QA — Round 158 (2026-11-24)

Iteration 90/100. Area: side effects of round 117 (mobile Pressables default to
`button`) — the modal sheets that use a Pressable as a tap-outside backdrop.

## Findings

### 1. Three mobile sheets were folded into a single unnamed "button" for screen readers — FIXED

- **Where:** [`AyahView.tsx`](../../apps/mobile/src/components/AyahView.tsx) (āyah
  More sheet), [`SaveToCollection.tsx`](../../apps/mobile/src/components/SaveToCollection.tsx),
  [`ReaderControls.tsx`](../../apps/mobile/src/components/ReaderControls.tsx) (reciter sheet)
- **Symptom (from source):** each sheet sat *inside* a full-screen backdrop
  `Pressable` (tap outside to close), and two also wrapped their content in a
  "stop-propagation" `Pressable`. A Pressable is an accessibility element by
  default; on iOS an accessible element hides its children, so VoiceOver saw one
  node (now named only "button", after round 117) instead of Share / Copy /
  Memorize, the collection list, or the reciters. Go to's sheet was already
  right: its scrim is a *sibling*, not a wrapper.
- **Fix:** the wrapping Pressables are `accessible={false}` (tapping outside
  still closes); each sheet is `accessibilityViewIsModal` with
  `onAccessibilityEscape` so the VoiceOver escape gesture closes it, alongside
  Android back (`onRequestClose`).

## Verification

mobile `tsc`, ESLint clean. Needs a VoiceOver/TalkBack spot check on a device
(not available in this session).

## Verdict

One real mobile accessibility bug (three sheets), fixed.
