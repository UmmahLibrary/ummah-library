# Manual E2E QA — Round 163 (2026-11-24)

Iteration 95/100. Area: "Verse of the day" across web, extension and mobile —
re-checking the question left open in round 54.

## Findings

None fixed — still an owner decision.

## Investigated

Web (Today, `/` card) and the extension both call core `verseOfDay(date)` — a
hash over all 6,236 āyāt, so the same date gives the same āyah on both. Mobile
picks from its own six curated verses in `apps/mobile/src/verses.ts`, so on any
given day the phone and the website show different "verses of the day".
Unifying is easy either way (mobile calls `verseOfDay`, or core gains a curated
list), but which experience is wanted — any āyah, or a short curated set — is a
product choice, so it stays recorded rather than changed.

## Verification

No code changes.

## Verdict

Clean (decision pending, as in round 54).
