"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { nextAdhkarReminder } from "@ummahlibrary/core";
import {
  ensureTodaysTimings,
  readCoords,
  remindersEnabled,
  setRemindersEnabled,
} from "../lib/adhkar-reminders";
import { WebNotifier } from "../lib/web-notifier";

const notifier = new WebNotifier();

export function AdhkarReminderToggle() {
  const [enabled, setEnabled] = useState(false);
  const [hasCoords, setHasCoords] = useState(true);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnabled(remindersEnabled());
    setHasCoords(readCoords() !== null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNextLabel(null);
      return;
    }
    let cancelled = false;
    void ensureTodaysTimings().then((timings) => {
      if (cancelled || !timings) return;
      const next = nextAdhkarReminder(timings, new Date());
      setNextLabel(
        next
          ? `Next: ${next.occasion} adhkar at ${new Date(next.at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Both reminders have passed for today.",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  async function toggle() {
    if (!enabled) {
      if (notifier.permission() === "default") {
        // Ask through the port; the in-app banner still works if it's declined.
        await notifier.requestPermission();
      }
      setRemindersEnabled(true);
      setEnabled(true);
      setHasCoords(readCoords() !== null);
    } else {
      setRemindersEnabled(false);
      setEnabled(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="adhkar-remind-box">
      <div className="adhkar-remind-row">
        <div>
          <strong>Reminders</strong>
          <p className="hifz-muted adhkar-remind-note">
            A nudge for morning adhkar after Fajr and evening adhkar after ʿAṣr, using your prayer
            times. Works while Ummah Library is open.
          </p>
        </div>
        <button
          type="button"
          className={enabled ? "chip chip--active" : "chip"}
          aria-pressed={enabled}
          onClick={toggle}
        >
          {enabled ? "🔔 On" : "🔕 Off"}
        </button>
      </div>
      {enabled && !hasCoords && (
        <p className="hifz-muted">
          Set your location on <Link href="/prayer-times">Prayer times</Link> so reminders know when
          Fajr and ʿAṣr are.
        </p>
      )}
      {enabled && hasCoords && nextLabel && (
        <p className="hifz-muted adhkar-remind-next">{nextLabel}</p>
      )}
    </div>
  );
}
