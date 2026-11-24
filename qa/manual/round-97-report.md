# Manual E2E QA — Round 97 (2026-11-24)

Iteration 29/100. Area: Nearby Mosques when location fails — geolocation
overridden in the page to return each error code.

## Findings

### 1. Every location failure said "permission was denied" — FIXED

- **Where:** [`MosqueFinder.tsx`](../../apps/web/src/components/MosqueFinder.tsx)
- **Symptom:** a timeout or switched-off location services (error codes 2/3)
  showed "Location permission was denied. Enable it in your browser…" — sending
  people to a setting that is already on.
- **Fix:** code 1 keeps that message; 2/3 show "Couldn't get your location. Check
  that location services are turned on, then try again." (The mobile screen
  already separates permission from failure.)

### 2. Status and error messages weren't announced — FIXED

- **Symptom:** "Getting your location…", "Searching nearby…" and the
  denied/offline/error cards appeared silently for screen-reader users.
- **Fix:** `role="status"` on progress lines, `role="alert"` on the error cards.

**Regression test:** `MosqueFinder.test.tsx` "tells a refusal apart from location
being unavailable, and announces it".

## Verification

MosqueFinder tests 9/9; `tsc`, ESLint clean; live — a simulated refusal shows the
denied card.

## Verdict

Two real bugs, fixed.
