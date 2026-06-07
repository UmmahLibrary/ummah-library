# ADR 0017 — Adhkar reminders: wired off prayer times, in-app + local notification

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

With prayer times ([0012](0012-prayer-times.md)) and adhkar ([0016](0016-adhkar.md))
both shipped, the natural tie-in is a **reminder**: nudge the user toward the
morning adhkar after Fajr and the evening adhkar after ʿAṣr. The question is how
to deliver a *timed* reminder without breaking the local-first, no-backend stance
(0003, 0006).

A reminder that fires **while the app is closed** needs the Web Push API: a
service worker subscription, **VAPID keys, a subscription store, and a server to
send the pushes** — i.e. the same backend + PII shift as Phase 4 (#25). The
experimental Notification Triggers API (timed `showTrigger`) is Chromium-only and
not dependable. So closed-app push is out of scope for now, for the same reasons
accounts are.

## Decision

**1. The reminder *windows* are pure core, derived from prayer timings.**
`core/adhkar.ts` gains `adhkarReminderWindows` (morning **Fajr→Dhuhr**, evening
**ʿAṣr→Maghrib**), `activeAdhkarReminder(timings, now)` and
`nextAdhkarReminder(timings, now)` — clock-injected and unit-tested. The reminder
is literally a function of the prayer-times output, not a fixed wall-clock time.

**2. Reach is in-app + a local notification while open.** A layout-level
`AdhkarReminderBanner` shows when `now` is inside a window; if the user has
granted notification permission, a local `Notification` also fires at the next
window's opening **while a tab is open**. The day's timings are fetched once from
the existing `/api/v1/prayer-times` function and cached per day; the location and
calculation settings are reused from prayer times (`ul.prayerCoords` etc.) — no
new input. The on/off preference is local (`ul.adhkarReminders`), dismissals are
per-occasion-per-day.

**3. Honest about the limit, in the UI.** The toggle says "Works while Ummah
Library is open." We do not pretend to deliver closed-app reminders we can't.

## Consequences

- **Good:** a useful reminder that stays **100% local** — no backend, no push
  infrastructure, no PII, no new permissions beyond an optional notification
  grant. The pure windows are shared with mobile, where a real local scheduler
  (Expo notifications) can later implement the *same* core contract.
- **Limit:** no reminder when the browser/PWA is fully closed. **Trigger to
  revisit:** if closed-app reminders are wanted on web, add Web Push behind a
  small service (VAPID + a subscription store) — that is an accounts-adjacent,
  ADR-worthy backend decision (see #25), deliberately not taken here. The core
  windows and the toggle stay unchanged when it is.
