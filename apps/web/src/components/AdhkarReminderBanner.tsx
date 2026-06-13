"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type AdhkarOccasion, type PrayerTimings, activeAdhkarReminder } from "@ummahlibrary/core";
import {
  ADHKAR_EMOJI,
  ADHKAR_LABEL,
  REMINDERS_KEY,
  ensureTodaysTimings,
  remindersEnabled,
  syncAdhkarReminder,
} from "../lib/adhkar-reminders";
import { WebNotifier } from "../lib/web-notifier";

const SEEN_KEY = "ul.adhkarReminderSeen";

// This feature's own notifier — its cancelAll() must not touch prayer reminders,
// which run on a separate WebNotifier instance.
const notifier = new WebNotifier();

function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; dismissed: string[] };
    return parsed.date === localDate() ? parsed.dismissed : [];
  } catch {
    return [];
  }
}

function dismiss(occasion: AdhkarOccasion): void {
  const dismissed = Array.from(new Set([...readSeen(), occasion]));
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ date: localDate(), dismissed }));
  } catch {
    /* ignore */
  }
}

/**
 * Surfaces the active adhkar reminder while the app is open, and — when the user
 * has granted notification permission — fires a local notification at the next
 * window's opening. Delivery goes through the {@link Notifier} port via
 * `syncAdhkarReminder` (no inline `Notification`); no server push (ADR 0017, 0019).
 */
export function AdhkarReminderBanner() {
  const [active, setActive] = useState<AdhkarOccasion | null>(null);
  const timingsRef = useRef<PrayerTimings | null>(null);

  const recompute = useCallback(() => {
    const timings = timingsRef.current;
    if (!timings) return;
    const occ = activeAdhkarReminder(timings, new Date());
    setActive(occ && !readSeen().includes(occ) ? occ : null);
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
      if (!remindersEnabled()) {
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
            dismiss(active);
            setActive(null);
          }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}
