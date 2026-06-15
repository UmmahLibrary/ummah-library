"use client";

import { useEffect } from "react";
import { PLAN_REMINDER_KEY, syncPlanReminder } from "../lib/plan-reminders";
import { READING_PLAN_EVENT } from "../lib/reading-plan";
import { WebNotifier } from "../lib/web-notifier";

// One notifier for the whole app; its in-page timer lives as long as the tab.
const notifier = new WebNotifier();

/**
 * Mounted once in the layout. Keeps the active plan's daily reminder scheduled
 * while a tab is open — on load, whenever the reminder preference or the active
 * plan changes, and on a coarse interval so the schedule rolls over to the next
 * day. Renders nothing (#71, ADR 0019).
 */
export function PlanReminderScheduler() {
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void syncPlanReminder(notifier);
    };

    run();
    window.addEventListener(PLAN_REMINDER_KEY, run);
    window.addEventListener(READING_PLAN_EVENT, run);
    const tick = setInterval(run, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener(PLAN_REMINDER_KEY, run);
      window.removeEventListener(READING_PLAN_EVENT, run);
      clearInterval(tick);
      void notifier.cancelAll();
    };
  }, []);

  return null;
}
