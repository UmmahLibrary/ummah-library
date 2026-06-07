"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  type AdhkarOccasion,
  type PrayerTimings,
  activeAdhkarReminder,
  nextAdhkarReminder,
} from "@ummahlibrary/core";
import { REMINDERS_KEY, ensureTodaysTimings, remindersEnabled } from "../lib/adhkar-reminders";

const SEEN_KEY = "ul.adhkarReminderSeen";
const LABEL: Record<AdhkarOccasion, string> = { morning: "morning", evening: "evening" };
const EMOJI: Record<AdhkarOccasion, string> = { morning: "🌅", evening: "🌆" };

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
 * window's opening. No server push (see ADR 0017); this is the in-app reach.
 */
export function AdhkarReminderBanner() {
  const [active, setActive] = useState<AdhkarOccasion | null>(null);
  const timingsRef = useRef<PrayerTimings | null>(null);
  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNotification = useCallback(() => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    const timings = timingsRef.current;
    if (!timings || typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }
    const next = nextAdhkarReminder(timings, new Date());
    if (!next) return;
    const delay = next.at.getTime() - Date.now();
    if (delay < 0 || delay > 24 * 60 * 60 * 1000) return;
    notifyTimer.current = setTimeout(() => {
      try {
        new Notification(`Time for ${LABEL[next.occasion]} adhkar ${EMOJI[next.occasion]}`, {
          body: "Tap to open your remembrances on Ummah Library.",
          tag: `adhkar-${next.occasion}`,
          icon: "/icons/icon-192.png",
        });
      } catch {
        /* notifications unavailable */
      }
      recompute();
      scheduleNotification();
    }, delay);
  }, []);

  const recompute = useCallback(() => {
    const timings = timingsRef.current;
    if (!timings) return;
    const occ = activeAdhkarReminder(timings, new Date());
    setActive(occ && !readSeen().includes(occ) ? occ : null);
  }, []);

  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function start() {
      if (!remindersEnabled()) {
        setActive(null);
        timingsRef.current = null;
        return;
      }
      const timings = await ensureTodaysTimings();
      if (cancelled) return;
      timingsRef.current = timings;
      if (!timings) return;
      recompute();
      scheduleNotification();
      tick = setInterval(recompute, 60_000);
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
      if (notifyTimer.current) clearTimeout(notifyTimer.current);
      window.removeEventListener(REMINDERS_KEY, onPref);
    };
  }, [recompute, scheduleNotification]);

  if (!active) return null;

  return (
    <div className="adhkar-reminder" role="status">
      <span>
        {EMOJI[active]} It’s time for <strong>{LABEL[active]} adhkar</strong>.
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
