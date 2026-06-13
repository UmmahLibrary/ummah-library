"use client";

import { useEffect } from "react";
import { PRAYER_REMINDERS_KEY, syncPrayerReminders } from "../lib/prayer-reminders";
import { WebNotifier } from "../lib/web-notifier";

// One notifier for the whole app; its in-page timers live as long as the tab.
const notifier = new WebNotifier();

/**
 * Mounted once in the layout. Keeps the day's enabled prayer notifications
 * scheduled while a tab is open — on load, whenever the per-prayer preferences
 * change, and on a coarse interval so the schedule rolls over to the next day.
 * Renders nothing (ADR 0019).
 */
export function PrayerReminderScheduler() {
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void syncPrayerReminders(notifier);
    };

    run();
    window.addEventListener(PRAYER_REMINDERS_KEY, run);
    const tick = setInterval(run, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener(PRAYER_REMINDERS_KEY, run);
      clearInterval(tick);
      void notifier.cancelAll();
    };
  }, []);

  return null;
}
