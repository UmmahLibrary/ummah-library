"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type AdhkarReminderOccasion,
  type PrayerTimings,
  activeAdhkarReminder,
} from "@ummahlibrary/core";
import {
  ADHKAR_EMOJI,
  ADHKAR_LABEL,
  REMINDERS_KEY,
  ensureTodaysTimings,
  remindersEnabled,
  syncAdhkarReminder,
} from "../lib/adhkar-reminders";
import { dismissAdhkar, readAdhkarSeen } from "../lib/reminder-store";
import { WebNotifier } from "../lib/web-notifier";

// This feature's own notifier — a per-instance timer map, so its scheduling is
// independent of the prayer/plan schedulers' notifiers.
const notifier = new WebNotifier();

/**
 * Surfaces the active adhkar reminder while the app is open, and — when the user
 * has granted notification permission — fires a local notification at the next
 * window's opening. Delivery goes through the {@link Notifier} port via
 * `syncAdhkarReminder` (no inline `Notification`); no server push (ADR 0017, 0019).
 */
export function AdhkarReminderBanner() {
  const [active, setActive] = useState<AdhkarReminderOccasion | null>(null);
  const timingsRef = useRef<PrayerTimings | null>(null);

  const recompute = useCallback(() => {
    const timings = timingsRef.current;
    if (!timings) return;
    const occ = activeAdhkarReminder(timings, new Date());
    setActive(occ && !readAdhkarSeen().includes(occ) ? occ : null);
  }, []);

  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    // Update the in-app banner and (re)schedule the next notification. Run on a
    // minute tick so the schedule advances to the next window after one fires.
    const refresh = () => {
      recompute();
      void syncAdhkarReminder(notifier);
    };

    async function start() {
      if (!(await remindersEnabled())) {
        setActive(null);
        timingsRef.current = null;
        void notifier.cancelAll();
        return;
      }
      const timings = await ensureTodaysTimings();
      if (cancelled) return;
      timingsRef.current = timings;
      if (!timings) return;
      refresh();
      tick = setInterval(refresh, 60_000);
    }
    void start();

    const onPref = () => {
      if (tick) clearInterval(tick);
      void start();
    };
    window.addEventListener(REMINDERS_KEY, onPref);
    return () => {
      cancelled = true;
      if (tick) clearInterval(tick);
      void notifier.cancelAll();
      window.removeEventListener(REMINDERS_KEY, onPref);
    };
  }, [recompute]);

  if (!active) return null;

  return (
    <div className="adhkar-reminder" role="status">
      <span>
        {ADHKAR_EMOJI[active]} It’s time for <strong>{ADHKAR_LABEL[active]} adhkar</strong>.
      </span>
      <span className="adhkar-reminder-actions">
        <Link href="/adhkar" className="chip" onClick={() => setActive(null)}>
          Open
        </Link>
        <button
          type="button"
          className="adhkar-reminder-close"
          aria-label="Dismiss"
          onClick={() => {
            dismissAdhkar(active);
            setActive(null);
          }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}
