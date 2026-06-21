# ADR 0029 — Mobile notifications: ExpoNotifier behind the Notifier port

- **Status:** Accepted
- **Date:** 2026-06-21
- **Relates to:** [ADR 0019](0019-reminders.md), [ADR 0024](0024-local-storage-ports.md), #71

## Context

Reminders (prayer, adhkar, reading-plan) shipped web-only: the `Notifier` port
had just one adapter, `WebNotifier`, which uses in-page `setTimeout` and so fires
only while a tab is open. Mobile had no notifier at all. The reminder
*orchestration* was also trapped in the web app until it was moved into
`core/reminders.ts` (platform-neutral, every dependency injected) — which
unblocked a second adapter.

Two wrinkles shaped the mobile adapter:

1. **Sync vs async permission.** The `Notifier.permission()` contract is
   synchronous (the web reads `Notification.permission`), but
   `expo-notifications` exposes permission only via an async call.
2. **Recurrence.** `AppNotification` is a one-shot (`at`). The web re-schedules
   on every tab focus; a mobile app that's closed never re-runs that loop.

## Decision

**Add `ExpoNotifier` (`apps/mobile/src/notifier.ts`) implementing the existing
`Notifier` port — no port change.**

- **Cached permission.** The adapter caches the last-known status; `initNotifier()`
  (called on app start) and `requestPermission()` refresh it, so the synchronous
  `permission()` the orchestration calls stays accurate.
- **One-shot triggers, foreground re-sync.** Each `schedule()` maps `at` to a
  one-shot `expo-notifications` date trigger — **OS-scheduled, so it fires even
  when the app is closed** (the actual win over web). The app re-syncs on
  `AppState` "active" (the mobile analogue of the web's tab-focus re-sync) to roll
  the schedule to the next day. We deliberately did **not** add a native repeating
  trigger: it would force a port change and bake stale copy into a notification
  that can't reflect "today's" progress. Honest limit: a never-opened app gets
  today's reminder but not tomorrow's — same shape as the web's tab-bound limit,
  documented in ADR 0019.
- **Cancel by id.** Matches the core orchestration's id-space cancellation, so one
  notifier serves every reminder family.

This first cut wires the **reading-plan** daily reminder (the #71 primary bullet)
end-to-end on mobile (toggle on `PlanDetailScreen`, default time, opt-in,
permission requested on enable). The adhkar/prayer families — which also need a
mobile `PrayerSettingsStore` + `PrayerTimingsProvider` — follow next; the shared
`core` orchestration already supports them.

## Consequences

- #71 is delivered on mobile for reading plans; closed-app delivery works via the
  OS scheduler.
- Reusing the `core` orchestration means web and mobile share one reminder brain.
- Follow-ups (now landed): a time picker for the plan reminder
  (`@react-native-community/datetimepicker`), and the mobile `PrayerSettingsStore`
  + `PrayerTimingsProvider` adapters that light up the adhkar (AdhkarScreen toggle)
  and per-prayer (PrayerTimesScreen) reminder families — all reusing the same
  `core` orchestration. App's foreground re-sync covers all three families.
