# ADR 0019 — Per-prayer reminders behind a `Notifier` port

- **Status:** Accepted
- **Date:** 2026-06-13

## Context

Prayer times ([0012](0012-prayer-times.md)) show the day's salah; the natural
follow-on is to let the user opt **per prayer** into a reminder when each one
comes in. Adhkar reminders ([0017](0017-adhkar-reminders.md)) already proved the
local-first shape — derive the timing from prayer output, surface it in-app, fire
a local `Notification` while a tab is open, and stay honest that a fully-closed
app can't be reached without Web Push (a backend, VAPID keys, a subscription
store and PII — out of scope for the same reasons accounts are, see #25).

But 0017 reached for `new Notification(...)` **inline** in a component. Repeating
that for prayers would scatter platform calls through the UI and make the eventual
upgrade path (service worker, Web Push, Expo on mobile) a rewrite. Delivery is
exactly the kind of external concern our boundaries say belongs behind a port
([0001](0001-modular-monolith.md)).

## Decision

**1. The *what/when* is pure core.** `core/prayer.ts` gains `prayerReminders(timings,
enabled, now)` → the enabled obligatory prayers still ahead of `now`, in order.
Clock-injected, unit-tested, no notion of how a reminder is delivered.

**2. Delivery is a new core port.** `core/ports.ts` defines `Notifier`
(`isSupported` / `permission` / `requestPermission` / `schedule` / `cancel` /
`cancelAll`) over platform-neutral `AppNotification` and `NotifyPermission` types
— **no DOM dependency**, so it stays importable by `core`.

**3. The web adapter lives with the web platform.** `WebNotifier` (in
`apps/web`, where DOM types exist — `packages/adapters` is deliberately DOM-free so
it stays node-runnable for the API) implements `Notifier` with the Notifications
API and in-page `setTimeout`. The per-prayer on/off map is local
(`ul.prayerReminders`); a layout-mounted `PrayerReminderScheduler` re-syncs on
load, on preference change, and on a coarse interval (day rollover), reusing the
location/timings already cached for prayer times. The reminder UI is the
check/plus toggle on each prayer card.

**4. Honest about the limit, in the UI.** When a reminder is on the card note
reads "Reminders ring while Ummah Library is open in a tab" (or that notifications
are blocked/unsupported) — we don't promise closed-app delivery we can't give.

## Consequences

- **Good:** per-prayer reminders that stay **100% local** — no backend, no push
  infra, no PII, only an optional notification grant. The pure helper and the
  `Notifier` port are shared with mobile, where an Expo adapter implements the
  *same* contract; the UI and `core` never change when the delivery mechanism does.
- **One delivery path:** the 0017 adhkar reminder was migrated onto this same
  port (`syncAdhkarReminder`), so `web-notifier.ts` is the only code that touches
  the DOM Notifications API. A new delivery mechanism is added in one place.
- **Limit & trigger to revisit:** no reminder when the browser/PWA is fully
  closed. If wanted on web, add a service-worker / Web Push adapter behind the
  **same `Notifier` port** (VAPID + a subscription store) — an accounts-adjacent,
  ADR-worthy backend decision (see #25), deliberately not taken here.
