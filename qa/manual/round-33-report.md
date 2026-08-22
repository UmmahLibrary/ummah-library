# Manual E2E QA — Round 33 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Zakat Calculator screen, exercising the fixes from
commit `3ca0a57` ("keep gold/silver prices on reset, and block negative
amounts").

## Findings

None this round.

## Investigated, no bug found

- **Niṣāb price entry and calculation**: entering Gold per gram (75) and
  Silver per gram (0.85) correctly computes "Niṣāb (silver)" as
  612.36g × $0.85 = **$520.51**, and the "below niṣāb" / "above niṣāb"
  messaging updates correctly as net wealth crosses that threshold.
- **Negative-amount blocking**: typing `-500` into the "Gold" zakatable-asset
  field and `-200` into "Liabilities" both had the minus sign stripped
  (`sanitizeDecimal()` in
  [ZakatScreen.tsx:39](../../apps/mobile/src/screens/ZakatScreen.tsx#L39)
  strips everything but digits and a single "."), leaving "500" and "200"
  respectively — confirmed by re-reading the field after it lost focus.
- **Zakat due calculation**: with Cash $1,000 + Gold $500 = $1,500 total/net
  wealth against a $520.51 niṣāb, "Zakat due (2.5%)" correctly showed
  **$37.50** (2.5% × 1,500).
- **"Reset amounts"**: clears every zakatable-asset field and Liabilities
  back to 0/empty while leaving Currency, Gold/silver per gram, and the
  Threshold basis toggle untouched — matches
  [ZakatScreen.tsx:87-89](../../apps/mobile/src/screens/ZakatScreen.tsx#L87)'s
  documented intent exactly. A screenshot taken immediately after the tap
  still showed the old values (a stale-render timing artifact, the same
  class documented in rounds 24 and 31); a re-check ~2s later showed the
  correct reset state.
- **Threshold basis toggle** (Silver ⇄ Gold): switches correctly between
  "Silver (lower)" and "Gold (higher)", updating the selected pill's
  styling.
- **Nisab prices surviving navigation and reset**: re-entering the screen
  after navigating away, and tapping "Reset amounts", both preserve the
  previously-entered gold/silver prices — no round-trip data loss.

## Testing-workflow notes (not app bugs)

- Tapping a numeric `TextInput` positions the cursor at the tap point, not
  necessarily at the end of the existing text — a tap followed immediately
  by backspaces can be a no-op if the cursor lands at position 0. Using
  `KEYCODE_MOVE_END` (keyevent 123) before backspacing avoids this.
  Several early attempts this round appended new text to old
  (`"750.851"`, `"0.851000"`) or landed on the wrong field because a
  virtual-keyboard overlay was still covering the field's true screen
  position — all self-corrected by re-reading `uiautomator dump` bounds
  after the keyboard was dismissed with `keyevent 4` (back), which reliably
  closes the soft keyboard without navigating the screen away, unlike
  tapping arbitrary coordinates under the keyboard.

## Verification

No code changes this round — investigation only, no fix needed.

## Verdict

No bugs found this round. Clean-streak: 3/3 (rounds 31, 32, and 33 are all
clean) — the 3-in-a-row stop condition is met.
